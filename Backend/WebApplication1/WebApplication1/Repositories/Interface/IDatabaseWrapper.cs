using System.Data;
using System.Data.SqlClient;

namespace WebApplication1.Repositories.Interface;

public interface IDatabaseWrapper
{
    int ExecuteNonQuery(string query, params SqlParameter[]? parameters);
    int ExecuteNonQuery(string query, SqlParameter[]? parameters, IDbTransaction? transaction);
    object ExecuteScalar(string query, params SqlParameter[]? parameters);
    IDataReader ExecuteReader(string query, params SqlParameter[]? parameters);
    SqlConnection CreateConnection();
    Task<IDbTransaction> BeginTransactionAsync();
}