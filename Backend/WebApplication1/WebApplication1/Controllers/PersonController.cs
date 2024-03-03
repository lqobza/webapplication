using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonController : ControllerBase
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
        
    [HttpGet("update-address")]
    public IActionResult UpdateAddress([FromQuery] string address)
    {
        Console.WriteLine("update endpoint called");
        try
        {
            _personService.SetAddress(address);
            return Ok("Address updated successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"An error occurred: {ex.Message}");
        }
    }
}