using System.Security.Claims;

namespace FirstFlat.Api.Middleware;

public class SupabaseAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SupabaseAuthMiddleware> _logger;

    public SupabaseAuthMiddleware(RequestDelegate next, ILogger<SupabaseAuthMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Extract user ID from validated JWT (set by JwtBearer middleware)
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? context.User.FindFirst("sub")?.Value;

        if (userId != null)
        {
            context.Items["UserId"] = userId;
        }

        await _next(context);
    }
}
