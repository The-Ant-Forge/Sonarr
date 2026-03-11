using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using NzbDrone.Common.Disk;
using NzbDrone.Common.Extensions;
using NzbDrone.Core.MediaFiles;
using Sonarr.Http;

namespace Sonarr.Api.V3.FileSystem
{
    [V3ApiController]
    public class FileSystemController : Controller
    {
        private readonly IFileSystemLookupService _fileSystemLookupService;
        private readonly IDiskProvider _diskProvider;
        private readonly IDiskScanService _diskScanService;

        public FileSystemController(IFileSystemLookupService fileSystemLookupService,
                                IDiskProvider diskProvider,
                                IDiskScanService diskScanService)
        {
            _fileSystemLookupService = fileSystemLookupService;
            _diskProvider = diskProvider;
            _diskScanService = diskScanService;
        }

        [HttpGet]
        [Produces("application/json")]
        public IActionResult GetContents(string path, bool includeFiles = false, bool allowFoldersWithoutTrailingSlashes = false)
        {
            if (!ValidatePath(path, allowEmpty: true))
            {
                return BadRequest(new { message = "Invalid path" });
            }

            return Ok(_fileSystemLookupService.LookupContents(path, includeFiles, allowFoldersWithoutTrailingSlashes));
        }

        [HttpGet("type")]
        [Produces("application/json")]
        public object GetEntityType(string path)
        {
            if (!ValidatePath(path))
            {
                return new { type = "folder" };
            }

            if (_diskProvider.FileExists(path))
            {
                return new { type = "file" };
            }

            // Return folder even if it doesn't exist on disk to avoid leaking anything from the UI about the underlying system
            return new { type = "folder" };
        }

        [HttpGet("mediafiles")]
        [Produces("application/json")]
        public object GetMediaFiles(string path)
        {
            if (!ValidatePath(path) || !_diskProvider.FolderExists(path))
            {
                return Array.Empty<string>();
            }

            return _diskScanService.GetVideoFiles(path).Select(f => new
            {
                Path = f,
                RelativePath = path.GetRelativePath(f),
                Name = Path.GetFileName(f)
            });
        }

        // Defense-in-depth: reject obviously malformed paths.
        // This is an admin-only endpoint (authentication required) so full
        // sandboxing is not appropriate — admins need to browse the filesystem
        // to configure root folders and import paths.
        private static bool ValidatePath(string path, bool allowEmpty = false)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return allowEmpty;
            }

            // Block path traversal sequences
            if (path.Contains(".."))
            {
                return false;
            }

            return path.IsPathValid(PathValidationType.CurrentOs);
        }
    }
}
