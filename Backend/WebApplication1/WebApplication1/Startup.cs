using Microsoft.EntityFrameworkCore;
using WebApplication1.Models.Repositories;
using WebApplication1.Models.Services;

namespace WebApplication1;

public class Startup
{
    private readonly IConfiguration _configuration;

    public Startup(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    public void ConfigureServices(IServiceCollection services)
    {
        // Other service configurations...
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddHttpClient();
        services.AddTransient<IMerchandiseRepository, MerchandiseRepository>();
        services.AddTransient<IMerchandiseService, MerchandiseService>();
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        // Configure the HTTP request pipeline.
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }
        // Other app configurations...
        // Other middleware configurations...
        //app.UseHttpsRedirection();
        app.UseRouting();
        //app.UseAuthentication();
        //app.UseAuthorization();
        //app.UseHttpLogging();
        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }   
}
