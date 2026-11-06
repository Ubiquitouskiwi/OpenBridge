> [!IMPORTANT]
> OpenBridge is a prototype. The eligibility rules are drafts that experts have not verified yet.
> Results are estimates, not decisions. See `BUILD-INFO.json` in each download for the rules data
> version and the review status of each state.

## Downloads

| File                                                            | Who it is for                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openbridge-local-v*.zip`                                       | **Use it on your own computer.** Unzip, double-click `OpenBridge.html`. No install, no internet, nothing leaves your computer.                                                                                                       |
| `openbridge-rule-toolkit-v*.zip`                                | **For policy and legal experts.** Unzip, double-click `OpenBridge-Rule-Toolkit.html`. Review a state's rules against their sources, propose a rule change with a citation, or check a test case. No code, no install, works offline. |
| `openbridge-hosted-v*.tar.gz`                                   | **Host it for others.** Static site plus Dockerfile, Compose file, nginx and Caddy examples, and a no-dependency Node start script. See `README.md` inside.                                                                          |
| `openbridge-image-v*-linux-amd64.tar.gz`, `-linux-arm64.tar.gz` | **Prebuilt container image.** `docker load -i <file>`, then `docker run -p 127.0.0.1:8080:8080 openbridge:<version>`.                                                                                                                |
| `SHA256SUMS.txt`                                                | Checksums to confirm the downloads are intact.                                                                                                                                                                                       |

See `CHANGELOG.md` for the full list of changes.
