using System.Security.Claims;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Application.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromToken(string token);
    bool ValidateToken(string token);
}

