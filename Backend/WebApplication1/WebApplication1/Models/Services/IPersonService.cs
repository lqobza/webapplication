﻿namespace WebApplication1.Models.Services;

public interface IPersonService
{
    public string GetAddress(string firstName);

    public void SetAddress(string address);
}
