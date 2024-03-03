using WebApplication1.Models.Repositories;

namespace WebApplication1.Models.Services;

public class MerchandiseService : IMerchandiseService
{
    private readonly IMerchandiseRepository _merchandiseRepository;
    public MerchandiseService(IMerchandiseRepository merchandiseRepository)
    {
        _merchandiseRepository = merchandiseRepository;
    }

    public List<MerchandiseDto> GetAllMerchandise()
    {
        return _merchandiseRepository.GetAllMerchandise();
    }
}