pipeline {
    agent any
 
    /*
     * Prerequisites / Jenkins setup:
     *   - A credential of type "Username with password" named 'ghcr-credentials'
     *     with your GitHub username and a Personal Access Token (PAT) that has
     *     write:packages scope.  This replaces the GitHub Actions GITHUB_TOKEN.
     *   - Docker and Docker Buildx available on the Jenkins agent.
     *   - syft and grype either pre-installed on the agent or installed at
     *     runtime (this Jenkinsfile installs them at runtime, same as the
     *     original workflow).
     */
 
    environment {
        CREDENTIAL = "docker-hub"
        DOCKER_HUB = credentials("$CREDENTIAL")
        REGISTRY_USER = "${DOCKER_HUB_USR}"
        REGISTRY_PASSWORD = "${DOCKER_HUB_PSW}"      
        REGISTRY      = 'docker.io'
        REGISTRY_SERVER = "https://index.docker.io/v1/"
        // Replace with your GitHub org/repo, e.g. 'pvnovarese/2026-01-demo'
        REPOSITORY = "${DOCKER_HUB_USR}/${JOB_BASE_NAME}"
        BRANCH_NAME = "${GIT_BRANCH.split("/")[1]}"
        TAG = "build-${BUILD_NUMBER}"
        IMAGE = "${REGISTRY}/${REPOSITORY}:${TAG}"
        // might install some binaries here:
        LOCAL_BIN     = "${env.HOME}/.local/bin"
    } // end environment
 
 
    stages {
 
        // ------------------------------------------------------------------ //
        //  Stage 1 – BUILD                                                    //
        // ------------------------------------------------------------------ //
        stage('Build') {
            steps {
                // Log in to registry
                sh '''
                    echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY} -u "${REGISTRY_USER}" --password-stdin
                '''
                // set up buildx
                // docker buildx create --use --name jenkins-builder || true
                sh '''
                    docker buildx inspect --bootstrap
                '''
                // Build and push the image
                sh '''
                    docker buildx build --push --tag ${IMAGE} .
                '''
            } //end steps
        } // end stage
 
        // ------------------------------------------------------------------ //
        //  Stage 2 – IMAGE TEST                                               //
        // ------------------------------------------------------------------ //
        stage('ImageTest') {
            steps {
                // Install syft and grype
                sh '''
                    mkdir -p ${LOCAL_BIN}
                    curl -sSfL https://get.anchore.io/syft  | sh -s -- -b ${LOCAL_BIN}
                    curl -sSfL https://get.anchore.io/grype | sh -s -- -b ${LOCAL_BIN}
                '''
 
                // Log in to registry so the agent can pull the image
                //sh '''
                //    echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY} -u "${REGISTRY_USER}" --password-stdin'
                //'''
 
                // Generate SBOM (JSON + SPDX) and vulnerability report
                //sh '''
                //    ${LOCAL_BIN}/syft -o json=sbom.json -o spdx-json=spdx.json ${IMAGE}
                //    ${LOCAL_BIN}/grype -o json sbom:./sbom.json > grype-vulnerability-report.json
                //'''
            } // end steps
        } // end stage
    } // end stages
 
    post {
        always {
            // Clean up Docker login credentials from the agent
            sh 'docker logout ${REGISTRY} || true'
        } // end always
    } //end post
} //end pipeline
