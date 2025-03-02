using System.Data.SqlClient;

namespace WebApplication1.Repositories;

public abstract class BaseRepository
{
    protected readonly IConfiguration _configuration;

    protected BaseRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    protected SqlConnection CreateConnection()
    {
        return new SqlConnection(_configuration.GetConnectionString("DefaultConnection"));
    }
}