using FirstFlat.Api.DTOs;
using FirstFlat.Api.Models;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace FirstFlat.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly SupabaseDbService _db;
    public CategoriesController(SupabaseDbService db) => _db = db;
    private string GetUserId() => (string)HttpContext.Items["UserId"]!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, user_id, name, type, color, icon, monthly_limit, created_at FROM categories WHERE user_id = @uid ORDER BY created_at";
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        var list = new List<Category>();
        await using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync()) list.Add(MapCategory(r));
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"INSERT INTO categories (user_id, name, type, color, icon, monthly_limit)
            VALUES (@uid, @name, @type, @color, @icon, @limit)
            RETURNING id, user_id, name, type, color, icon, monthly_limit, created_at";
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("name", req.Name);
        cmd.Parameters.AddWithValue("type", req.Type);
        cmd.Parameters.AddWithValue("color", req.Color);
        cmd.Parameters.AddWithValue("icon", req.Icon);
        cmd.Parameters.AddWithValue("limit", req.MonthlyLimit.HasValue ? (object)req.MonthlyLimit.Value : DBNull.Value);
        await using var r = await cmd.ExecuteReaderAsync();
        await r.ReadAsync();
        return Created("", MapCategory(r));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCategoryRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"UPDATE categories SET name=@name, type=@type, color=@color, icon=@icon, monthly_limit=@limit
            WHERE id=@id AND user_id=@uid
            RETURNING id, user_id, name, type, color, icon, monthly_limit, created_at";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("name", req.Name);
        cmd.Parameters.AddWithValue("type", req.Type);
        cmd.Parameters.AddWithValue("color", req.Color);
        cmd.Parameters.AddWithValue("icon", req.Icon);
        cmd.Parameters.AddWithValue("limit", req.MonthlyLimit.HasValue ? (object)req.MonthlyLimit.Value : DBNull.Value);
        await using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return NotFound();
        return Ok(MapCategory(r));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM categories WHERE id=@id AND user_id=@uid";
        cmd.Parameters.AddWithValue("id", Guid.Parse(id));
        cmd.Parameters.AddWithValue("uid", Guid.Parse(GetUserId()));
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound();
        return NoContent();
    }

    private static Category MapCategory(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(0).ToString(),
        UserId = r.GetGuid(1).ToString(),
        Name = r.GetString(2),
        Type = r.GetString(3),
        Color = r.GetString(4),
        Icon = r.GetString(5),
        MonthlyLimit = r.IsDBNull(6) ? null : r.GetDecimal(6),
        CreatedAt = r.GetDateTime(7),
    };
}
