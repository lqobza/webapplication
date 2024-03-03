namespace WebApplication1.Models.Repositories;

public interface IMerchandiseRepository
{
    public List<MerchandiseDto> GetAllMerchandise();
}