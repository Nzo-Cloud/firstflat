using FirstFlat.Api.DTOs;
using FirstFlat.Api.Models;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace FirstFlat.Api.Controllers;

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly SupabaseDbService _db;

    public ProfilesController(SupabaseDbService db) => _db = db;

    private string GetUserId() => (string)HttpContext.Items["UserId"]!;

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, username, monthly_income, currency, onboarding_completed, created_at, updated_at FROM profiles WHERE id = @id";
        cmd.Parameters.AddWithValue("id", Guid.Parse(GetUserId()));

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return NotFound(new { error = "Profile not found" });

        return Ok(MapProfile(reader));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE profiles 
            SET username = @username, monthly_income = @income, currency = @currency
            WHERE id = @id
            RETURNING id, username, monthly_income, currency, onboarding_completed, created_at, updated_at";
        cmd.Parameters.AddWithValue("id", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("username", req.Username);
        cmd.Parameters.AddWithValue("income", req.MonthlyIncome);
        cmd.Parameters.AddWithValue("currency", req.Currency);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return NotFound();
        return Ok(MapProfile(reader));
    }

    [HttpPut("me/onboarding")]
    public async Task<IActionResult> CompleteOnboarding([FromBody] CompleteOnboardingRequest req)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            UPDATE profiles 
            SET username = @username, monthly_income = @income, currency = @currency, onboarding_completed = TRUE
            WHERE id = @id";
        cmd.Parameters.AddWithValue("id", Guid.Parse(GetUserId()));
        cmd.Parameters.AddWithValue("username", req.Username);
        cmd.Parameters.AddWithValue("income", req.MonthlyIncome);
        cmd.Parameters.AddWithValue("currency", req.Currency);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new { success = true });
    }

    private static Profile MapProfile(NpgsqlDataReader r) => new()
    {
        Id = r.GetGuid(0).ToString(),
        Username = r.GetString(1),
        MonthlyIncome = r.GetDecimal(2),
        Currency = r.GetString(3),
        OnboardingCompleted = r.GetBoolean(4),
        CreatedAt = r.GetDateTime(5),
        UpdatedAt = r.GetDateTime(6),
    };
}
