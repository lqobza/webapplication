using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class BaseRepository
{
    private readonly IDatabaseWrapper _db;

    protected BaseRepository(IDatabaseWrapper databaseWrapper)
    {
        _db = databaseWrapper;
    }

    protected SqlConnection CreateConnection()
    {
        return _db.CreateConnection();
    }
}