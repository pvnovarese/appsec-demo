pipeline {

    /*
     * Prerequisites / Jenkins setup:
     *   - A credential of type "Username with password" named 'docker-hub'
     *     with your docker hub username and a Personal Access Token (PAT) that has
     *     read/write permissions.
     *   - a credential ORCA_SECURITY_API_TOKEN with an api token
     *   - Curl, Docker and Docker Buildx available on the Jenkins agent.
     */

    
    agent any
    // this is actually probably not a great idea, I only tested this on a single node setup
    // if you do this on a multi-node setup, you would need to install orca-cli on every node
    // that the tests could possibly end up on.
 
    environment {
        // might install some binaries here:
        LOCAL_BIN     = "${env.HOME}/.local/bin"
        // Orca project key
        PROJECT_KEY = "appsec-demo"
    } // end environment
 
 
    stages {

        // install latest orca-cli in user's .local/bin
        stage('Install Tools') {
            steps {
                sh '''
                    curl -sfL 'https://raw.githubusercontent.com/orcasecurity/orca-cli/main/install.sh' | bash -s -- -b ${LOCAL_BIN} 1.107.0
                '''
            } // end steps
        } // end stage Install Tools

        stage('Orca AppSec Tests') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                        parallel (

                            //
                            // NOTE: --exit-code 0 prevents scan failures from breaking the build.
                            // In production, remove this flag from each stage so critical findings block the pipeline.
                            //

                            'Orca IaC Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" --api-token="${TOKEN}" iac scan --path=$(pwd)'
                            },

                            //-----------------------------------------------------------------------
                            // Secret scan has a bug in it as of v1.106.3, passing --disable-git-scan 
                            // seems to be a viable workaround for now.
                            //-----------------------------------------------------------------------
                            'Orca Secrets Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" --api-token="${TOKEN}" secrets scan --disable-git-scan'
                            },

                            'Orca SAST Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" --api-token="${TOKEN}" sast scan --path=$(pwd)'
                            },
                            
                            'Orca SCA Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" --api-token="${TOKEN}"  sca scan --path=$(pwd)'
                            } 
        
                        ) // end parallel
                    } // end withCredentials
                } // end script
            } // end steps
        } // end Orca AppSec Tests

        
        // ------------------------------------------------------------------ //
        //  Original – BUILD                                                  //
        //  just use your existing build step or if you're not                //
        //  containerizing, just skip this and the Container Image scan step. //
        // ------------------------------------------------------------------ //
        stage('Build') {
            environment {
                // Replace with your registry
                REGISTRY      = 'docker.io'
            }
            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASSWORD'
                )]) {
                    script {
                        // Setting env.IMAGE here makes it available to all subsequent stages
                        // You can change this as needed, e.g. change the tag scheme, whatever
                        env.IMAGE = "${REGISTRY}/${REGISTRY_USER}/${JOB_BASE_NAME}:build-${BUILD_NUMBER}"
                    } // end script
                    // log in to registry
                    sh 'echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY} -u "${REGISTRY_USER}" --password-stdin'
                    // set up buildx
                    sh 'docker buildx inspect --bootstrap'
                    // Build and push the image
                    sh 'docker buildx build --push --tag ${IMAGE} .'
                } // end withCredentials
            } //end steps
        } // end stage

        stage('Orca Container Image Security Scan') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'TOKEN')]) {
                        sh '''
                            ${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" --api-token="${TOKEN}" image scan ${IMAGE}
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
