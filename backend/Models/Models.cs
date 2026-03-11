namespace FirstFlat.Api.Models;

public class Profile
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public decimal MonthlyIncome { get; set; }
    public string Currency { get; set; } = "USD";
    public bool OnboardingCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Category
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "essential"; // essential | non-essential
    public string Color { get; set; } = "#6366f1";
    public string Icon { get; set; } = "tag";
    public decimal? MonthlyLimit { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Transaction
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public decimal Amount { get; set; }
    public string Type { get; set; } = "expense"; // income | expense
    public string? Description { get; set; }
    public DateOnly Date { get; set; }
    public DateTime CreatedAt { get; set; }
    // Navigation
    public Category? Category { get; set; }
}

public class Bill
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int DueDay { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
    // Navigation
    public Category? Category { get; set; }
}
