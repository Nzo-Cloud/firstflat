using Npgsql;

namespace FirstFlat.Api.Services;

public class SupabaseDbService
{
    private readonly string _connectionString;
    private readonly ILogger<SupabaseDbService> _logger;

    public SupabaseDbService(IConfiguration config, ILogger<SupabaseDbService> logger)
    {
        _connectionString = config["Supabase:ConnectionString"]
            ?? throw new InvalidOperationException("Supabase:ConnectionString not configured");
        _logger = logger;
    }

    public NpgsqlConnection CreateConnection() => new NpgsqlConnection(_connectionString);
}
