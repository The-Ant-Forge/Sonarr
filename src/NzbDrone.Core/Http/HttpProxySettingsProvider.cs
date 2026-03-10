using System;
using System.Linq;
using System.Net;
using NzbDrone.Common.Http;
using NzbDrone.Common.Http.Proxy;
using NzbDrone.Core.Configuration;

namespace NzbDrone.Core.Http
{
    public class HttpProxySettingsProvider : IHttpProxySettingsProvider
    {
        private readonly IConfigService _configService;

        public HttpProxySettingsProvider(IConfigService configService)
        {
            _configService = configService;
        }

        public HttpProxySettings GetProxySettings(HttpUri uri)
        {
            var proxySettings = GetProxySettings();
            if (proxySettings == null)
            {
                return null;
            }

            if (ShouldProxyBeBypassed(proxySettings, uri))
            {
                return null;
            }

            return proxySettings;
        }

        public HttpProxySettings GetProxySettings()
        {
            if (!_configService.ProxyEnabled)
            {
                return null;
            }

            return new HttpProxySettings(_configService.ProxyType,
                                _configService.ProxyHostname,
                                _configService.ProxyPort,
                                _configService.ProxyBypassFilter,
                                _configService.ProxyBypassLocalAddresses,
                                _configService.ProxyUsername,
                                _configService.ProxyPassword);
        }

        public bool ShouldProxyBeBypassed(HttpProxySettings proxySettings, HttpUri url)
        {
            // We are utilising the WebProxy implementation here to save us having to reimplement it. This way we use Microsofts implementation
            var proxy = new WebProxy(proxySettings.Host + ":" + proxySettings.Port, proxySettings.BypassLocalAddress, proxySettings.BypassListAsArray);

            return proxy.IsBypassed((Uri)url) || IsBypassedByIpAddressRange(proxySettings.BypassListAsArray, url.Host);
        }

        private static bool IsBypassedByIpAddressRange(string[] bypassList, string host)
        {
            if (!IPAddress.TryParse(host, out var ipAddress))
            {
                return false;
            }

            return bypassList.Any(bypass => IsIpInCidrRange(bypass, ipAddress));
        }

        private static bool IsIpInCidrRange(string cidr, IPAddress address)
        {
            var parts = cidr.Split('/');

            if (!IPAddress.TryParse(parts[0], out var networkAddress))
            {
                return false;
            }

            if (networkAddress.AddressFamily != address.AddressFamily)
            {
                return false;
            }

            if (parts.Length == 1)
            {
                return networkAddress.Equals(address);
            }

            if (!int.TryParse(parts[1], out var prefixLength))
            {
                return false;
            }

            var networkBytes = networkAddress.GetAddressBytes();
            var addressBytes = address.GetAddressBytes();

            var fullBytes = prefixLength / 8;
            var remainingBits = prefixLength % 8;

            for (var i = 0; i < fullBytes; i++)
            {
                if (networkBytes[i] != addressBytes[i])
                {
                    return false;
                }
            }

            if (remainingBits > 0 && fullBytes < networkBytes.Length)
            {
                var mask = (byte)(0xFF << (8 - remainingBits));

                if ((networkBytes[fullBytes] & mask) != (addressBytes[fullBytes] & mask))
                {
                    return false;
                }
            }

            return true;
        }
    }
}
