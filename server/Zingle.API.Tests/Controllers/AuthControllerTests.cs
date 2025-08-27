namespace Zingle.API.Tests.Controllers
{
    public class AuthControllerTests
    {
        private AuthController CreateController(
            Mock<UserManager<AppUser>> userManagerMock,
            Mock<SignInManager<AppUser>> signInManagerMock,
            TokenService tokenService,
            ILogger<AuthController> logger = null
        )
        {
            return new AuthController(userManagerMock.Object, signInManagerMock.Object, tokenService, logger);
        }

    }
}