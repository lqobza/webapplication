using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebApplication1.Repositories;
using WebApplication1.Repositories.Interface;
using WebApplication1.Services;
using WebApplication1.Services.Interface;
using WebApplication1.Utils;

namespace WebApplication1;

public class Startup
{
    private readonly IConfiguration _configuration;

    public Startup(IConfiguration configuration)
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
            .AddEnvironmentVariables()
            .AddUserSecrets<Startup>(optional: true);

        _configuration = builder.Build();
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
        
        // Register the DbContext with dependency injection
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(_configuration.GetConnectionString("DefaultConnection")));
 
        // Other service configurations...
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        services.AddHttpClient();
        
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new ArgumentNullException("JWT Key is not configured properly.");
        }
        
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidAudience = _configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
        });

        services.AddTransient<IMerchandiseRepository, MerchandiseRepository>();
        services.AddTransient<IMerchandiseService, MerchandiseService>();
        services.AddTransient<IRatingRepository, RatingRepository>();
        services.AddTransient<IRatingService, RatingService>();
        services.AddTransient<IOrderRepository, OrderRepository>();
        services.AddTransient<IOrderService, OrderService>();
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMerchandiseImageRepository, MerchandiseImageRepository>();
        services.AddScoped<IImageStorageService, FileSystemImageService>();
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
        else
        {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
            app.UseHttpsRedirection();
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