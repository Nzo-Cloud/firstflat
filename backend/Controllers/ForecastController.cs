using FirstFlat.Api.DTOs;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FirstFlat.Api.Controllers;

[ApiController]
[Route("api/forecast")]
[Authorize]
public class ForecastController : ControllerBase
{
    private readonly AnthropicService _anthropic;
    public ForecastController(AnthropicService anthropic) => _anthropic = anthropic;

    [HttpPost]
    public async Task<IActionResult> GetForecast([FromBody] ForecastRequest req)
    {
        try
        {
            var result = await _anthropic.GetForecastAsync(req);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(502, new { error = $"AI service unavailable: {ex.Message}" });
        }
    }
}
