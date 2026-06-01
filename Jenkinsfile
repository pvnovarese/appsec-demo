pipeline {
    agent any
 
    /*
     * Prerequisites / Jenkins setup:
     *   - A credential of type "Username with password" named 'docker-hub'
     *     with your docker hub username and a Personal Access Token (PAT) that has
     *     read/write permissions.
     *   - a credential ORCA_SECURITY_API_TOKEN with an api token
     *   - Curl, Docker and Docker Buildx available on the Jenkins agent.
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
        // Orca project key
        PROJECT_KEY = "appsec-demo"
    } // end environment
 
 
    stages {

        stage('Orca AppSec Tests') {
            parallel {
                
                stage('Orca IaC Security Scan') {
                    steps {
                        script {
                            withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                                sh '''
                                    # apt update && apt install -y curl
                                    # curl -sfL 'https://raw.githubusercontent.com/orcasecurity/orca-cli/main/install.sh' | bash -s -- -b ~/.local/bin
                                    ~/.local/bin/orca-cli --no-color --exit-code 0 -p "${PROJECT_KEY}" --api-token "${TOKEN}" iac scan --path $(pwd)
                                '''
                            } // end withCredentials
                        } // end script
                    } // end steps
                } // end stage IaC

                //-----------------------------------------------------------------------------------
                // Secret scan has a bug in it as of v1.106.3, I'll uncomment this when it's resolved
                //-----------------------------------------------------------------------------------
                stage('Orca Secrets Scan') {
                    steps {
                        script {
                            withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                                sh '''
                                    # env
                                    # ~/.local/bin/orca-cli --no-color --exit-code 0 --project-key "${PROJECT_KEY}" --api-token "${TOKEN}" --debug secrets scan
                                    ~/.local/bin/orca-cli --no-color --exit-code 0 --project-key="appsec-demo" --api-token="${TOKEN}" --debug secrets scan 
                                '''
                            } // end withCredentials
                        } // end script
                    } // end steps
                } // end stage Secrets
        
                stage('Orca SAST Scan') {
                    steps {
                        script {
                            withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                                sh '''
                                    ~/.local/bin/orca-cli --no-color --exit-code 0 -p "${PROJECT_KEY}" --api-token "${TOKEN}" sast scan --path $(pwd)
                                '''
                            } // end withCredentials
                        } // end script
                    } // end steps
                } // end stage SAST

              stage('Orca SCA Scan') {
                  steps {
                      script {
                          withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                              sh '''
                                  ~/.local/bin/orca-cli --no-color --exit-code 0 -p "${PROJECT_KEY}" --api-token "${TOKEN}" sca scan --path $(pwd)
                              '''
                          } // end withCredentials
                      } // end script
                  } // end steps
              } // end stage SCA
        
            } // end parallel
        } // end Orca AppSec Tests

        
        // ------------------------------------------------------------------ //
        //  Original – BUILD                                                    //
        // ------------------------------------------------------------------ //
        stage('Build') {
            steps {
                // Log in to registry
                sh '''
                    echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY} -u "${REGISTRY_USER}" --password-stdin
                '''
                // set up buildx, then build and push
                sh '''
                    ### docker buildx create --use --name jenkins-builder || true
                    docker buildx inspect --bootstrap
                    docker buildx build --push --tag ${IMAGE} .
                '''
            } //end steps
        } // end stage

        stage('Orca Container Image Security Scan') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                        sh '''
                            ~/.local/bin/orca-cli --no-color --exit-code 0 -p "${PROJECT_KEY}" --api-token "${TOKEN}" image scan ${IMAGE}
                        '''
                    } //end withCredentials
                } // end script
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
