using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Zingle.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UploadsController : ControllerBase
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly ILogger<UploadsController> _logger;
        private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif" };
        private readonly string[] _allowedFileExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip", ".rar" };

        public UploadsController(
            IWebHostEnvironment hostingEnvironment,
            ILogger<UploadsController> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;
        }

        [HttpPost("images")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedImageExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", _allowedImageExtensions)}");
            }

            if (file.Length > 5 * 1024 * 1024) // 5 MB limit
            {
                return BadRequest("File size exceeds the limit (5MB)");
            }

            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Images");

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{userId}-{DateTime.UtcNow.Ticks}{extension}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var url = $"{Request.Scheme}://{Request.Host}/api/uploads/images/{uniqueFileName}";

                return Ok(new { url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image");
                return StatusCode(500, "Error uploading image");
            }
        }

        [HttpPost("files")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedFileExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", _allowedFileExtensions)}");
            }

            if (file.Length > 20 * 1024 * 1024) // 20 MB limit
            {
                return BadRequest("File size exceeds the limit (20MB)");
            }

            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var uploadsFolder = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Files");

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                var uniqueFileName = $"{userId}-{DateTime.UtcNow.Ticks}-{Path.GetFileName(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var url = $"{Request.Scheme}://{Request.Host}/api/uploads/files/{uniqueFileName}";

                return Ok(new
                {
                    url,
                    fileName = file.FileName,
                    fileSize = file.Length,
                    contentType = file.ContentType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file");
                return StatusCode(500, "Error uploading file");
            }
        }

        [HttpGet("images/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetImage(string fileName)
        {
            var filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Images", fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            return File(fileBytes, contentType);
        }

        [HttpGet("files/{fileName}")]
        [AllowAnonymous]
        public IActionResult GetFile(string fileName)
        {
            var filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Files", fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(filePath, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            var fileBytes = System.IO.File.ReadAllBytes(filePath);
            return File(fileBytes, contentType, Path.GetFileName(fileName));
        }

        [HttpDelete("images/{fileName}")]
        public IActionResult DeleteImage(string fileName)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Only allow users to delete their own files
            if (!fileName.StartsWith($"{userId}-"))
            {
                return Forbid();
            }

            var filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Images", fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            try
            {
                System.IO.File.Delete(filePath);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image");
                return StatusCode(500, "Error deleting image");
            }
        }

        [HttpDelete("files/{fileName}")]
        public IActionResult DeleteFile(string fileName)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Only allow users to delete their own files
            if (!fileName.StartsWith($"{userId}-"))
            {
                return Forbid();
            }

            var filePath = Path.Combine(_hostingEnvironment.ContentRootPath, "Uploads", "Files", fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            try
            {
                System.IO.File.Delete(filePath);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file");
                return StatusCode(500, "Error deleting file");
            }
        }
    }
}
