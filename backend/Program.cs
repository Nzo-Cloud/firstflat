using FirstFlat.Api.Middleware;
using FirstFlat.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// CORS – allow frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:3000" };
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

// JWT / Supabase Auth – RS256 via JWKS discovery
var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        // Supabase exposes OIDC discovery at: {url}/auth/v1/.well-known/openid-configuration
        // ASP.NET will auto-fetch + cache the JWKS public keys from there.
        opts.Authority = $"{supabaseUrl}/auth/v1";
        opts.RequireHttpsMetadata = true;

        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = false,      // Supabase issuer varies – skip for now
            ValidateAudience = false,    // No audience claim in Supabase tokens
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(60),
            NameClaimType = "sub",
        };

        opts.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"[JWT] Auth failed: {context.Exception.GetType().Name}: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var userId = context.Principal?.FindFirst("sub")?.Value;
                Console.WriteLine($"[JWT] Token validated for user: {userId}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<SupabaseDbService>();
builder.Services.AddSingleton<AnthropicService>();

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<SupabaseAuthMiddleware>();
app.MapControllers();

app.Run();
