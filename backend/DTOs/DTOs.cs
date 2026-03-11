using System.Text.Json.Serialization;

namespace FirstFlat.Api.DTOs;

// Profile
public record UpdateProfileRequest(string Username, decimal MonthlyIncome, string Currency);

// Category
public record CreateCategoryRequest(
    string Name,
    [property: JsonPropertyName("type")] string Type,
    string Color,
    string Icon,
    decimal? MonthlyLimit);

public record UpdateCategoryRequest(
    string Name,
    string Type,
    string Color,
    string Icon,
    decimal? MonthlyLimit);

// Transaction
public record CreateTransactionRequest(
    string? CategoryId,
    decimal Amount,
    string Type,
    string? Description,
    DateOnly Date);

public record UpdateTransactionRequest(
    string? CategoryId,
    decimal Amount,
    string Type,
    string? Description,
    DateOnly Date);

public record TransactionFilterRequest
{
    public int? Month { get; init; }
    public int? Year { get; init; }
    public string? CategoryId { get; init; }
    public string? Type { get; init; }
    public string? Search { get; init; }
}

// Bill
public record CreateBillRequest(
    string Name,
    decimal Amount,
    int DueDay,
    string? CategoryId);

public record UpdateBillRequest(
    string Name,
    decimal Amount,
    int DueDay,
    bool IsPaid,
    string? CategoryId);

// Forecast
public record ForecastRequest(
    decimal BalanceRemaining,
    decimal DailyAverageSpend,
    decimal TotalUpcomingBills,
    int DaysLeftInMonth,
    List<CategorySpend> CategoryBreakdown);

public record CategorySpend(string Category, decimal Amount, string Type);

public record ForecastResponse(
    int DaysUntilEmpty,
    List<string> TopCategoriesToCut,
    string WeeklySavingSuggestion,
    string Encouragement);
