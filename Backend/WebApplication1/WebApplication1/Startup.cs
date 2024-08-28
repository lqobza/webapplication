using System.Text.Json.Serialization;
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
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAllOrigins",
                builder =>
                {
                    builder.WithOrigins("http://localhost:4200")
                        .AllowAnyMethod()
                        .AllowAnyHeader();
                });
        });
        // Other service configurations...
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddHttpClient();
        services.AddTransient<IMerchandiseRepository, MerchandiseRepository>();
        services.AddTransient<IMerchandiseService, MerchandiseService>();
        services.AddTransient<IRatingRepository, RatingRepository>();
        services.AddTransient<IRatingService, RatingService>();
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseCors("AllowAllOrigins");

        // Configure the HTTP request pipeline.
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c => { c.InjectStylesheet("/swagger-ui/SwaggerDark.css"); });
            app.UseDeveloperExceptionPage();
        }

        // Other app configurations...
        // Other middleware configurations...
        // app.UseHttpsRedirection();
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        //app.UseHttpLogging();
        app.UseDefaultFiles();
        app.UseStaticFiles();
        app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
    }
}