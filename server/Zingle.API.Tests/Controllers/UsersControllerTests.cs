using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;
using Zingle.API.Controllers;
using Zingle.API.DTOs;
using Zingle.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Zingle.API.Tests.Controllers
{
    public class UsersControllerTests
    {
        private UsersController CreateController(
            Mock<UserManager<AppUser>> userManagerMock,
            Mock<ILogger<UsersController>> loggerMock,
            ClaimsPrincipal? user = null)
        {
            var controller = new UsersController(userManagerMock.Object, loggerMock.Object);
            if (user != null)
            {
                controller.ControllerContext = new ControllerContext
                {
                    HttpContext = new DefaultHttpContext { User = user }
                };
            }
            return controller;
        }

        [Fact]
        public async Task GetUser_WithValidId_ReturnsUserDto()
        {
            // Arrange
            var user = new AppUser
            {
                Id = "1",
                UserName = "user1",
                DisplayName = "User One",
                Email = "user1@test.com",
                AvatarUrl = "url1",
                IsOnline = true,
                LastActive = null,
                Bio = "Bio1"
            };

            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
            userManagerMock.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });

            var loggerMock = new Mock<ILogger<UsersController>>();
            var controller = CreateController(userManagerMock, loggerMock);

            // Act
            var result = await controller.GetUser("1");

            // Assert
            var okResult = Assert.IsType<ActionResult<UserDto>>(result);
            var userDto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("1", userDto.Id);
            Assert.Equal("user1", userDto.Username);
            Assert.Equal("User One", userDto.DisplayName);
            Assert.Equal("user1@test.com", userDto.Email);
            Assert.Equal("User", userDto.Role);
        }

        [Fact]
        public async Task GetUser_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("999")).ReturnsAsync((AppUser?)null);

            var loggerMock = new Mock<ILogger<UsersController>>();
            var controller = CreateController(userManagerMock, loggerMock);

            // Act
            var result = await controller.GetUser("999");

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateProfile_WithValidData_ReturnsUpdatedUserDto()
        {
            // Arrange
            var user = new AppUser
            {
                Id = "1",
                UserName = "user1",
                DisplayName = "User One",
                Email = "user1@test.com",
                AvatarUrl = "url1",
                IsOnline = true,
                LastActive = null,
                Bio = "Bio1"
            };

            var updateDto = new UpdateUserDto
            {
                Username = "newusername",
                DisplayName = "New Display Name",
                Bio = "New Bio",
                AvatarUrl = "newurl"
            };

            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
            userManagerMock.Setup(x => x.FindByNameAsync("newusername")).ReturnsAsync((AppUser?)null);
            userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<AppUser>())).ReturnsAsync(IdentityResult.Success);
            userManagerMock.Setup(x => x.GetRolesAsync(It.IsAny<AppUser>())).ReturnsAsync(new List<string> { "User" });

            var loggerMock = new Mock<ILogger<UsersController>>();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var principal = new ClaimsPrincipal(identity);

            var controller = CreateController(userManagerMock, loggerMock, principal);

            // Act
            var result = await controller.UpdateProfile(updateDto);

            // Assert
            var okResult = Assert.IsType<ActionResult<UserDto>>(result);
            var userDto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal("1", userDto.Id);
            Assert.Equal("newusername", userDto.Username);
            Assert.Equal("New Display Name", userDto.DisplayName);
            Assert.Equal("New Bio", userDto.Bio);
            Assert.Equal("newurl", userDto.AvatarUrl);
        }

        [Fact]
        public async Task UpdateProfile_WithExistingUsername_ReturnsBadRequest()
        {
            // Arrange
            var user = new AppUser
            {
                Id = "1",
                UserName = "user1",
                DisplayName = "User One",
                Email = "user1@test.com",
                Bio = "Bio1"
            };

            var existingUser = new AppUser { Id = "2", UserName = "existinguser" };

            var updateDto = new UpdateUserDto
            {
                Username = "existinguser"
            };

            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
            userManagerMock.Setup(x => x.FindByNameAsync("existinguser")).ReturnsAsync(existingUser);

            var loggerMock = new Mock<ILogger<UsersController>>();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var principal = new ClaimsPrincipal(identity);

            var controller = CreateController(userManagerMock, loggerMock, principal);

            // Act
            var result = await controller.UpdateProfile(updateDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Username is already taken", badRequestResult.Value);
        }

        [Fact]
        public async Task ChangePassword_WithValidData_ReturnsOk()
        {
            // Arrange
            var user = new AppUser { Id = "1", UserName = "user1" };

            var changePasswordDto = new ChangePasswordDto
            {
                CurrentPassword = "oldpassword",
                NewPassword = "newpassword",
                ConfirmNewPassword = "newpassword"
            };

            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);
            userManagerMock.Setup(x => x.ChangePasswordAsync(user, "oldpassword", "newpassword"))
                .ReturnsAsync(IdentityResult.Success);

            var loggerMock = new Mock<ILogger<UsersController>>();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var principal = new ClaimsPrincipal(identity);

            var controller = CreateController(userManagerMock, loggerMock, principal);

            // Act
            var result = await controller.ChangePassword(changePasswordDto);

            // Assert
            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task ChangePassword_WithMismatchedPasswords_ReturnsBadRequest()
        {
            // Arrange
            var user = new AppUser { Id = "1", UserName = "user1" };

            var changePasswordDto = new ChangePasswordDto
            {
                CurrentPassword = "oldpassword",
                NewPassword = "newpassword",
                ConfirmNewPassword = "differentpassword"
            };

            var userManagerMock = new Mock<UserManager<AppUser>>(
                Mock.Of<IUserStore<AppUser>>(), null!, null!, null!, null!, null!, null!, null!, null!);

            userManagerMock.Setup(x => x.FindByIdAsync("1")).ReturnsAsync(user);

            var loggerMock = new Mock<ILogger<UsersController>>();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1")
            };
            var identity = new ClaimsIdentity(claims, "mock");
            var principal = new ClaimsPrincipal(identity);

            var controller = CreateController(userManagerMock, loggerMock, principal);

            // Act
            var result = await controller.ChangePassword(changePasswordDto);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("New passwords do not match", badRequestResult.Value);
        }
    }
}
