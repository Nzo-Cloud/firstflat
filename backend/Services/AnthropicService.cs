using System.Text;
using System.Text.Json;
using FirstFlat.Api.DTOs;

namespace FirstFlat.Api.Services;

public class AnthropicService
{
    private readonly HttpClient _http;
    private readonly ILogger<AnthropicService> _logger;
    private const string ApiUrl = "https://api.anthropic.com/v1/messages";
    private const string Model = "claude-3-5-sonnet-20241022";

    public AnthropicService(IHttpClientFactory factory, IConfiguration config, ILogger<AnthropicService> logger)
    {
        _http = factory.CreateClient();
        _http.DefaultRequestHeaders.Add("x-api-key", config["Anthropic:ApiKey"]);
        _http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        _logger = logger;
    }

    public async Task<ForecastResponse> GetForecastAsync(ForecastRequest req)
    {
        var categoryBreakdown = string.Join("\n", req.CategoryBreakdown
            .Select(c => $"  - {c.Category} ({c.Type}): {c.Amount:N2}"));

        var prompt = new StringBuilder();
        prompt.AppendLine("You are a friendly financial advisor for someone living alone for the first time.");
        prompt.AppendLine("Analyze their budget situation and provide helpful, encouraging advice.");
        prompt.AppendLine();
        prompt.AppendLine("Current financial situation:");
        prompt.AppendLine($"- Balance remaining this month: {req.BalanceRemaining:N2}");
        prompt.AppendLine($"- Daily average spend (last 7 days): {req.DailyAverageSpend:N2}");
        prompt.AppendLine($"- Total upcoming bills this month: {req.TotalUpcomingBills:N2}");
        prompt.AppendLine($"- Days left in month: {req.DaysLeftInMonth}");
        prompt.AppendLine("- Spending by category:");
        prompt.AppendLine(categoryBreakdown);
        prompt.AppendLine();
        prompt.AppendLine("Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):");
        prompt.AppendLine("{");
        prompt.AppendLine("  \"days_until_empty\": <integer, estimated days until budget runs out, -1 if enough>,");
        prompt.AppendLine("  \"top_categories_to_cut\": [\"category1\", \"category2\", \"category3\"],");
        prompt.AppendLine("  \"weekly_saving_suggestion\": \"<specific amount in same currency, e.g. 50.00>\",");
        prompt.AppendLine("  \"encouragement\": \"<warm, friendly 1-2 sentence message for a first-time solo liver>\"");
        prompt.AppendLine("}");
        prompt.AppendLine();
        prompt.AppendLine("Be gentle, encouraging, and specific. This person is new to managing their own finances.");

        var body = new
        {
            model = Model,
            max_tokens = 512,
            messages = new[]
            {
                new { role = "user", content = prompt.ToString() }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var response = await _http.PostAsync(ApiUrl, content);
        var raw = await response.Content.ReadAsStringAsync();
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("[Anthropic] HTTP {Status} — Body: {Body}", (int)response.StatusCode, raw);
            response.EnsureSuccessStatusCode();
        }

        using var doc = JsonDocument.Parse(raw);
        var text = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "{}";

        var result = JsonSerializer.Deserialize<JsonElement>(text);
        var days = result.GetProperty("days_until_empty").GetInt32();
        var cats = result.GetProperty("top_categories_to_cut").EnumerateArray()
            .Select(e => e.GetString() ?? "").ToList();
        var saving = result.GetProperty("weekly_saving_suggestion").GetString() ?? "";
        var enc = result.GetProperty("encouragement").GetString() ?? "";

        return new ForecastResponse(days, cats, saving, enc);
    }
}