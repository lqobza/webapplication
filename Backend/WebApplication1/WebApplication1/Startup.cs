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

    public Startup()
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
            options.AddPolicy("AllowAngularApp",
                builder =>
                {
                    builder.WithOrigins("http://localhost:4200")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials();
                });
        });
        
        // Register the DbContext with dependency injection
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(_configuration.GetConnectionString("DefaultConnection")));
 
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

        
        services.AddScoped<IMerchandiseRepository, MerchandiseRepository>();
        services.AddScoped<IRatingRepository, RatingRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICustomDesignRepository, CustomDesignRepository>();

        services.AddScoped<IDatabaseWrapper, DatabaseWrapper>();

        services.AddTransient<IMerchandiseService, MerchandiseService>();
        services.AddTransient<IRatingService, RatingService>();
        services.AddTransient<IOrderService, OrderService>();
        services.AddTransient<ICustomDesignService, CustomDesignService>();

        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMerchandiseImageRepository, MerchandiseImageRepository>();
        services.AddScoped<IImageStorageService, FileSystemImageService>();
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseCors("AllowAngularApp");

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