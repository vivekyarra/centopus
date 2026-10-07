# Portfolio verification — October 7, 2026

Author: Yarra Vivek. Repository: https://github.com/vivekyarra/centopus.

The live frontend returned HTTP 200 at https://main.d1s2dm4wj8xxb.amplifyapp.com/.
The backend health endpoint returned status `ok`, mode `AWS`, and `execution_available: true`.
The deployed backend reported release `f335ecc439f42c0aeba96854cec854a701f57417` and `live_view_available: false`.

This is a clean source snapshot. Application code, tests, lockfiles, deployment configuration, documentation, and four historical evidence screenshots are included. Dependencies, generated builds, private environment files, local run output, recordings, and earlier Git history are excluded. Repository references and OIDC policy examples target vivekyarra/centopus. Applying policy examples to AWS is a separate action; production deployment workflows require `ENABLE_AWS_DEPLOYMENT=true`.

Python worker verification passed: 29 unit tests and example-plan validation. Node, infrastructure, and offline browser checks were started; their completion was not required before publishing at the author's request. Hosted CI records the checks for the published commit.

A dependency audit initially found two high-severity transitive issues. Updating source-map-js resolved one; the bundled brace-expansion dependency in aws-cdk-lib still has an audit finding. Further changes were stopped at the author's request.

AWS CLI authentication was expired. Public health checks verify deployment availability, not effective IAM, an authenticated full browser-agent run, billing, or fresh 100-agent performance. Historical reports and screenshots are supporting project history. Actual billing and integrated Live View remain unfinished.
