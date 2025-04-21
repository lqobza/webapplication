using System.Data;
using System.Data.SqlClient;
using WebApplication1.Repositories.Interface;

namespace WebApplication1.Repositories;

public class DatabaseWrapper : IDatabaseWrapper
{
    private readonly IConfiguration _configuration;

    public DatabaseWrapper(IConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    public SqlConnection CreateConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
            throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        return new SqlConnection(connectionString);
    }

    public int ExecuteNonQuery(string query, params SqlParameter[]? parameters)
    {
        if (string.IsNullOrEmpty(query)) throw new ArgumentNullException(nameof(query));

        using var connection = CreateConnection();
        connection.Open();
        using var command = new SqlCommand(query, connection);

        // Set command type to StoredProcedure if the command text is in the format [dbo].[ProcedureName]
        if (query.StartsWith("[dbo].")) command.CommandType = CommandType.StoredProcedure;

        if (parameters is { Length: > 0 }) command.Parameters.AddRange(parameters);
        return command.ExecuteNonQuery();
    }

    public int ExecuteNonQuery(string query, SqlParameter[]? parameters, IDbTransaction? transaction)
    {
        if (string.IsNullOrEmpty(query)) throw new ArgumentNullException(nameof(query));

        if (transaction == null) return ExecuteNonQuery(query, parameters);

        var command = new SqlCommand(query, (SqlConnection)transaction.Connection);
        command.Transaction = (SqlTransaction)transaction;

        if (query.StartsWith("[dbo].")) command.CommandType = CommandType.StoredProcedure;

        if (parameters is { Length: > 0 }) command.Parameters.AddRange(parameters);

        return command.ExecuteNonQuery();
    }

    public object ExecuteScalar(string query, params SqlParameter[]? parameters)
    {
        if (string.IsNullOrEmpty(query)) throw new ArgumentNullException(nameof(query));

        using var connection = CreateConnection();
        connection.Open();
        using var command = new SqlCommand(query, connection);

        if (query.StartsWith("[dbo].")) command.CommandType = CommandType.StoredProcedure;

        if (parameters is { Length: > 0 }) command.Parameters.AddRange(parameters);
        var result = command.ExecuteScalar();
        return result == DBNull.Value ? null : result;
    }

    public IDataReader ExecuteReader(string query, params SqlParameter[]? parameters)
    {
        if (string.IsNullOrEmpty(query)) throw new ArgumentNullException(nameof(query));

        SqlConnection connection = null!;
        try
        {
            connection = CreateConnection();
            connection.Open();
            var command = new SqlCommand(query, connection);

            if (query.StartsWith("[dbo].")) command.CommandType = CommandType.StoredProcedure;

            if (parameters is { Length: > 0 }) command.Parameters.AddRange(parameters);

            // connection with "using" is not working in this case, as reader would be unable to read the data
            var result = command.ExecuteReader(CommandBehavior.CloseConnection);
            return result;
        }
        catch
        {
            connection.Close();
            throw;
        }
    }

    public async Task<IDbTransaction> BeginTransactionAsync()
    {
        SqlConnection connection = null!;
        try
        {
            connection = CreateConnection();
            await connection.OpenAsync();
            return connection.BeginTransaction();
        }
        catch
        {
            //closing the connection if an exception occurs
            connection.Close();
            throw;
        }
    }
}