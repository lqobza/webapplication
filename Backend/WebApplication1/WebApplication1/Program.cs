using WebApplication1;
using dotenv.net;

var builder = Host.CreateDefaultBuilder();

DotEnv.Load();
builder.ConfigureWebHostDefaults(webBuilder =>
{
    webBuilder.UseStartup<Startup>();
    webBuilder.UseWebRoot(
        Path.Combine(Directory.GetCurrentDirectory(), "..", "frontend", "dist")
    );
});
//DotEnv.Read("ConnectionStrings__DefaultConnection");
var app = builder.Build();

app.Run();
