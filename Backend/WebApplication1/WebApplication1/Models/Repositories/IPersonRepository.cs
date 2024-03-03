namespace WebApplication1.Models.Repositories;

public interface IPersonRepository
{
    public string GetAddress(string firstName);

    public void SetAddress(string address);
}
