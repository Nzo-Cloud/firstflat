using FirstFlat.Api.DTOs;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace FirstFlat.Api.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly SupabaseDbService _db;
    public BillsController(SupabaseDbService db) => _db = db;
    private string GetUserId() => (string)HttpContext.Items["UserId"]!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            SELECT b.id, b.user_id, b.category_id, b.name, b.amount, b.due_day, b.is_paid, b.created_at,
                   c.name, c.color, c.icon
            FROM bills b
            LEFT JOIN categories c ON c.id = b.category_id
            WHERE b.user_id = @uid
            ORDER BY b.due_day";
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        var list = new List<object>();
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) list.Add(MapBill(r));
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBillRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO bills (user_id, category_id, name, amount, due_day)
            VALUES (@uid, @catId, @name, @amount, @due)
            RETURNING id, user_id, category_id, name, amount, due_day, is_paid, created_at";
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("catId", req.CategoryId != null ? (object)Guid.Parse(req.CategoryId) : DBNull.Value);
        cmd.Parameters.AddWithValue("name", req.Name);
        cmd.Parameters.AddWithValue("amount", req.Amount);
        cmd.Parameters.AddWithValue("due", req.DueDay);
        await using var r = await cmd.ExecuteReaderAsync();
        await r.ReadAsync();
        return Created("", MapBillBasic(r));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateBillRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE bills SET name=@name, amount=@amount, due_day=@due, is_paid=@paid, category_id=@catId
            WHERE id=@id AND user_id=@uid
            RETURNING id, user_id, category_id, name, amount, due_day, is_paid, created_at";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("name", req.Name);
        cmd.Parameters.AddWithValue("amount", req.Amount);
        cmd.Parameters.AddWithValue("due", req.DueDay);
        cmd.Parameters.AddWithValue("paid", req.IsPaid);
        cmd.Parameters.AddWithValue("catId", req.CategoryId != null ? (object)Guid.Parse(req.CategoryId) : DBNull.Value);
        await using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return NotFound();
        return Ok(MapBillBasic(r));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM bills WHERE id=@id AND user_id=@uid";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound();
        return NoContent();
    }

    private static object MapBill(NpgsqlDataReader r) => new
    {
        id = r.GetGuid(0).ToString(),
        userId = r.GetGuid(1).ToString(),
        categoryId = r.IsDBNull(2) ? null : r.GetGuid(2).ToString(),
        name = r.GetString(3),
        amount = r.GetDecimal(4),
        dueDay = r.GetInt32(5),
        isPaid = r.GetBoolean(6),
        createdAt = r.GetDateTime(7),
        category = r.IsDBNull(8) ? null : new { name = r.GetString(8), color = r.GetString(9), icon = r.GetString(10) }
    };

    private static object MapBillBasic(NpgsqlDataReader r) => new
    {
        id = r.GetGuid(0).ToString(),
        userId = r.GetGuid(1).ToString(),
        categoryId = r.IsDBNull(2) ? null : r.GetGuid(2).ToString(),
        name = r.GetString(3),
        amount = r.GetDecimal(4),
        dueDay = r.GetInt32(5),
        isPaid = r.GetBoolean(6),
        createdAt = r.GetDateTime(7),
    };
}
