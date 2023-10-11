using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using Dapper;

namespace WebApplication1.Models.Repositories;

public class PersonRepository : IPersonRepository
{
    public IConfiguration _configuration;

    public PersonRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GetAddress(string firstName)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        using (SqlConnection dbConnection = new SqlConnection(connectionString))
        {
            dbConnection.Open();
            string query = "SELECT Address FROM Persons WHERE FirstName = @FirstName";
            SqlCommand command = new SqlCommand(query, dbConnection);
            command.Parameters.AddWithValue("@FirstName", firstName);

            string rv = command.ExecuteScalar()?.ToString() ?? throw new InvalidOperationException();
            dbConnection.Close();
            return rv;
        }
    }
}
