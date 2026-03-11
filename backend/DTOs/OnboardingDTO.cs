// Add missing DTO
namespace FirstFlat.Api.DTOs;

public record CompleteOnboardingRequest(string Username, decimal MonthlyIncome, string Currency);
