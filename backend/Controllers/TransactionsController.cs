using FirstFlat.Api.DTOs;
using FirstFlat.Api.Models;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace FirstFlat.Api.Controllers;

[ApiController]
[Route("api/transactions")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly SupabaseDbService _db;
    public TransactionsController(SupabaseDbService db) => _db = db;
    private string GetUserId() => (string)HttpContext.Items["UserId"]!;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TransactionFilterRequest filter)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new List<string> { "t.user_id = @uid" };
        var cmd = conn.CreateCommand();
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));

        if (filter.Month.HasValue) { conditions.Add("EXTRACT(MONTH FROM t.date) = @month"); cmd.Parameters.AddWithValue("month", filter.Month.Value); }
        if (filter.Year.HasValue) { conditions.Add("EXTRACT(YEAR FROM t.date) = @year"); cmd.Parameters.AddWithValue("year", filter.Year.Value); }
        if (!string.IsNullOrEmpty(filter.CategoryId)) { conditions.Add("t.category_id = @catId"); cmd.Parameters.AddWithValue("catId", Guid.Parse(filter.CategoryId)); }
        if (!string.IsNullOrEmpty(filter.Type)) { conditions.Add("t.type = @type"); cmd.Parameters.AddWithValue("type", filter.Type); }
        if (!string.IsNullOrEmpty(filter.Search)) { conditions.Add("t.description ILIKE @search"); cmd.Parameters.AddWithValue("search", $"%{filter.Search}%"); }

        cmd.CommandText = $@"
            SELECT t.id, t.user_id, t.category_id, t.amount, t.type, t.description, t.date, t.created_at,
                   c.name, c.color, c.icon, c.type as cat_type
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE {string.Join(" AND ", conditions)}
            ORDER BY t.date DESC, t.created_at DESC";

        var list = new List<object>();
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) list.Add(MapTransaction(r));
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO transactions (user_id, category_id, amount, type, description, date)
            VALUES (@uid, @catId, @amount, @type, @desc, @date)
            RETURNING id, user_id, category_id, amount, type, description, date, created_at";
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("catId", req.CategoryId != null ? (object)Guid.Parse(req.CategoryId) : DBNull.Value);
        cmd.Parameters.AddWithValue("amount", req.Amount);
        cmd.Parameters.AddWithValue("type", req.Type);
        cmd.Parameters.AddWithValue("desc", req.Description ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("date", req.Date.ToDateTime(TimeOnly.MinValue));
        await using var r = await cmd.ExecuteReaderAsync();
        await r.ReadAsync();
        return Created("", MapTransactionBasic(r));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateTransactionRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE transactions SET category_id=@catId, amount=@amount, type=@type, description=@desc, date=@date
            WHERE id=@id AND user_id=@uid
            RETURNING id, user_id, category_id, amount, type, description, date, created_at";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("catId", req.CategoryId != null ? (object)Guid.Parse(req.CategoryId) : DBNull.Value);
        cmd.Parameters.AddWithValue("amount", req.Amount);
        cmd.Parameters.AddWithValue("type", req.Type);
        cmd.Parameters.AddWithValue("desc", req.Description ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("date", req.Date.ToDateTime(TimeOnly.MinValue));
        await using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return NotFound();
        return Ok(MapTransactionBasic(r));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM transactions WHERE id=@id AND user_id=@uid";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound();
        return NoContent();
    }

    private static object MapTransaction(NpgsqlDataReader r) => new
    {
        id = r.GetGuid(0).ToString(),
        userId = r.GetGuid(1).ToString(),
        categoryId = r.IsDBNull(2) ? null : r.GetGuid(2).ToString(),
        amount = r.GetDecimal(3),
        type = r.GetString(4),
        description = r.IsDBNull(5) ? null : r.GetString(5),
        date = DateOnly.FromDateTime(r.GetDateTime(6)),
        createdAt = r.GetDateTime(7),
        category = r.IsDBNull(8) ? null : new
        {
            name = r.GetString(8),
            color = r.GetString(9),
            icon = r.GetString(10),
            type = r.GetString(11),
        }
    };

    private static object MapTransactionBasic(NpgsqlDataReader r) => new
    {
        id = r.GetGuid(0).ToString(),
        userId = r.GetGuid(1).ToString(),
        categoryId = r.IsDBNull(2) ? null : r.GetGuid(2).ToString(),
        amount = r.GetDecimal(3),
        type = r.GetString(4),
        description = r.IsDBNull(5) ? null : r.GetString(5),
        date = DateOnly.FromDateTime(r.GetDateTime(6)),
        createdAt = r.GetDateTime(7),
    };
}
