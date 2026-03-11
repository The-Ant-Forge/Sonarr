using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using FluentAssertions;
using NUnit.Framework;
using NzbDrone.Core.Configuration;
using NzbDrone.Core.Security;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.Security
{
    [TestFixture]
    public class X509CertificateValidationServiceFixture : CoreTest<X509CertificateValidationService>
    {
        private X509Certificate2 _certificate;

        [SetUp]
        public void Setup()
        {
            _certificate = null;

            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.CertificateValidation)
                .Returns(CertificateValidationType.Enabled);
        }

        // --- Sender type handling ---

        [Test]
        public void should_bypass_when_sender_is_not_sslstream_or_string()
        {
            var result = Subject.ShouldByPassValidationError(
                new object(),
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors);

            result.Should().BeTrue();
        }

        [Test]
        public void should_not_bypass_for_string_sender_with_errors_and_validation_enabled()
        {
            var result = Subject.ShouldByPassValidationError(
                "example.com",
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors);

            result.Should().BeFalse();
        }

        // --- No SSL errors ---

        [Test]
        public void should_bypass_when_no_ssl_policy_errors()
        {
            var result = Subject.ShouldByPassValidationError(
                "example.com",
                _certificate,
                null,
                SslPolicyErrors.None);

            result.Should().BeTrue();
        }

        // --- Localhost bypass ---

        [TestCase("localhost")]
        [TestCase("127.0.0.1")]
        public void should_bypass_for_localhost_even_with_errors(string host)
        {
            var result = Subject.ShouldByPassValidationError(
                host,
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateNameMismatch);

            result.Should().BeTrue();
        }

        // --- Validation disabled ---

        [Test]
        public void should_bypass_when_validation_disabled()
        {
            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.CertificateValidation)
                .Returns(CertificateValidationType.Disabled);

            var result = Subject.ShouldByPassValidationError(
                "8.8.8.8",
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors);

            result.Should().BeTrue();
        }

        // --- DisabledForLocalAddresses ---

        [TestCase("10.0.0.1")]
        [TestCase("192.168.1.1")]
        [TestCase("172.16.0.1")]
        public void should_bypass_for_local_address_when_disabled_for_local(string host)
        {
            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.CertificateValidation)
                .Returns(CertificateValidationType.DisabledForLocalAddresses);

            var result = Subject.ShouldByPassValidationError(
                host,
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors);

            result.Should().BeTrue();
        }

        [TestCase("8.8.8.8")]
        [TestCase("1.1.1.1")]
        public void should_not_bypass_for_public_address_when_disabled_for_local(string host)
        {
            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.CertificateValidation)
                .Returns(CertificateValidationType.DisabledForLocalAddresses);

            var result = Subject.ShouldByPassValidationError(
                host,
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors);

            result.Should().BeFalse();
        }

        // --- Enabled validation rejects errors ---

        [TestCase(SslPolicyErrors.RemoteCertificateChainErrors)]
        [TestCase(SslPolicyErrors.RemoteCertificateNameMismatch)]
        [TestCase(SslPolicyErrors.RemoteCertificateNotAvailable)]
        public void should_reject_when_validation_enabled_and_errors_present(SslPolicyErrors errors)
        {
            var result = Subject.ShouldByPassValidationError(
                "8.8.8.8",
                _certificate,
                null,
                errors);

            result.Should().BeFalse();
        }

        // --- Localhost does NOT bypass when no errors (fast path) ---

        [Test]
        public void should_bypass_localhost_with_no_errors_via_fast_path()
        {
            var result = Subject.ShouldByPassValidationError(
                "localhost",
                _certificate,
                null,
                SslPolicyErrors.None);

            result.Should().BeTrue();
        }

        // --- Combined error flags ---

        [Test]
        public void should_reject_combined_ssl_errors_when_enabled()
        {
            var result = Subject.ShouldByPassValidationError(
                "8.8.8.8",
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors | SslPolicyErrors.RemoteCertificateNameMismatch);

            result.Should().BeFalse();
        }

        [Test]
        public void should_bypass_combined_ssl_errors_when_disabled()
        {
            Mocker.GetMock<IConfigService>()
                .SetupGet(s => s.CertificateValidation)
                .Returns(CertificateValidationType.Disabled);

            var result = Subject.ShouldByPassValidationError(
                "8.8.8.8",
                _certificate,
                null,
                SslPolicyErrors.RemoteCertificateChainErrors | SslPolicyErrors.RemoteCertificateNameMismatch);

            result.Should().BeTrue();
        }
    }
}
