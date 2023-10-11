using WebApplication1.Models.Repositories;

namespace WebApplication1.Models.Services;

public class PersonService : IPersonService
{
    private readonly IPersonRepository _personRepository;
    public PersonService(IPersonRepository personRepository)
    {
        _personRepository = personRepository;
    }

    public string GetAddress(string firstName)
    {
        return _personRepository.GetAddress(firstName);
    }
}
