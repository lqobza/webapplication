using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Services;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonController
{
    private readonly IPersonService _personService;
    
    public PersonController(IPersonService personService)
    {
        _personService = personService;
    }

    [HttpGet]
    public JsonResult GetAddress([FromQuery] string firstName)
    {
        return new JsonResult(_personService.GetAddress(firstName));
    }
}