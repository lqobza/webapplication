using System.Data.SqlClient;

namespace WebApplication1.Models.Repositories;

public class MerchandiseRepository : IMerchandiseRepository
{
    private IConfiguration _configuration;

    public MerchandiseRepository(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        using (SqlConnection dbConnection = new SqlConnection(connectionString))
        {
            dbConnection.Open();
            string query = "SELECT * FROM Merch";
            SqlCommand command = new SqlCommand(query, dbConnection);
            SqlDataReader reader = command.ExecuteReader();
            List<MerchandiseDto> merchList = new List<MerchandiseDto>();
            while (reader.Read())
            {
                MerchandiseDto merchandise = new MerchandiseDto()
                {
                    Id = (int)reader["id"],
                    CategoryId = (int)reader["category"],
                    Name = (string)reader["name"],
                    InStock = (int)reader["instock"],
                    Price = (int)reader["price"],
                    Description = (string)reader["description"],
                    Rating = (int)reader["rating"],
                    Size = (string)reader["size"],
                    BrandId = (int)reader["brand"]
                };
                merchList.Add(merchandise);
                Console.Write(merchandise.ToString());
            }
            reader.Close();
            dbConnection.Close();
            return merchList;
        }
    }

    
}