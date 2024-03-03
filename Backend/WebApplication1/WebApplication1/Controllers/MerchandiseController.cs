using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Services;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchandiseController
{
    private readonly IMerchandiseService _merchandiseService;
    
    public MerchandiseController(IMerchandiseService merchandiseService)
    {
        _merchandiseService = merchandiseService;
    }

    [HttpGet]
    public JsonResult GetAllMercandise()
    {
        return new JsonResult(_merchandiseService.GetAllMerchandise());
    }
}