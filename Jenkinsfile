pipeline {

    /*
     * Prerequisites / Jenkins setup:
     *   - A credential of type "Username with password" named 'docker-hub'
     *     with your docker hub username and a Personal Access Token (PAT) that has
     *     read/write permissions.
     *   - a credential ORCA_SECURITY_API_TOKEN with an api token with "Shift Left User" role
     *   - create a PROJECT_KEY in orca (a label to organize the findings)
     *   - Curl, Docker and Docker Buildx available on the Jenkins agent.
     */
    
    agent any
    // this is actually probably not a great idea, I only tested this on a single node setup
    // if you do this on a multi-node setup, you would need to install orca-cli on every node
    // that the tests could possibly end up on.

    options {
        // Kill the run if it hangs (e.g. a scan or buildx push that stalls)
        timeout(time: 30, unit: 'MINUTES')

        // Only one run at a time — prevents concurrent runs from fighting over
        // the shared buildx builder and the docker login/logout session
        disableConcurrentBuilds()

        // Keep the last 20 builds' logs/artifacts, discard older ones
        buildDiscarder(logRotator(numToKeepStr: '20'))

        // Prefix every console line with a timestamp (handy for scan timing)
        // (this needs the timestamper plugin, which is usually installed by default)
        timestamps()
    }
 
    environment {
        // Replace with your registry (if you're using container images, if not you can ignore this)
        REGISTRY      = 'docker.io'
        // might install some binaries here:
        LOCAL_BIN     = "${env.HOME}/.local/bin"
        // Orca project key (this is a label for organizing the results, not a secret)
        PROJECT_KEY = "appsec-demo"
    } // end environment
 
    stages {
        //
        stage('Setup') {
            steps {
                // Clean before build
                cleanWs()
                // We need to explicitly checkout from SCM here
                checkout scm
                // install orca-cli 
                // note: we are installing this outside of the workspace, so it doesn't get wiped when you issue the 
                // the cleanWs (before the build, and in the post stage). 
                //
                // orca-cli docs: https://docs.orcasecurity.io/docs/orca-cli
                //
                // to do: add a check so we skip the download if it's already available (need to check the version)
                sh '''
                    curl -sfL 'https://raw.githubusercontent.com/orcasecurity/orca-cli/main/install.sh' | bash -s -- -b ${LOCAL_BIN} 1.108.1
                '''
            } // end steps
        } // end stage Setup
        //
        stage('Orca AppSec Tests') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'ORCA_SECURITY_API_TOKEN')]) {
                        parallel (
                            //
                            // in this section , you need a PROJECT_KEY (a label Orca uses to organize findings) which
                            // is defined globally since it's going to also be used in the container scan stage.
                            //
                            // NOTE: --exit-code 0 prevents scan failures from breaking the build.
                            // In production, remove this flag from each stage so critical findings block the pipeline.
                            //
                            // orca-cli lets you pass the api token on the command line with --api-token but it also will
                            // simply read it from the env ORCA_SECURITY_API_TOKEN, which is what we're using here.
                            //
                            // --path is required for iac, sast, and sca scans, but is optional and defaults to pwd for secrets scan.
                            //
                            'Orca IaC Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" iac scan --path=$(pwd)'
                            },
                            //------------------------------------------------------------------------------
                            // Secret scan has a bug in it as of v1.106.3, passing --disable-git-scan 
                            // seems to be a viable workaround for now.  Bug seems to still exist in 1.107.0
                            //------------------------------------------------------------------------------
                            'Orca Secrets Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" secrets scan --disable-git-scan'
                            },

                            'Orca SAST Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" sast scan --path=$(pwd)'
                            },
                            
                            'Orca SCA Scan': {
                                sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" sca scan --dependency-tree --path=$(pwd)'
                            } 
                            //
                        ) // end parallel
                    } // end withCredentials
                } // end script
            } // end steps
        } // end Orca AppSec Tests

        
        // --------------------------------------------------------------------------------
        //  Original – BUILD                                                  
        //  just use your existing build step, this is just here for demo purposes.
        //  HOWEVER, note that I'm setting env.IMAGE in this step, which is needed for the
        //  container scan step (makes sure we're scanning the image that is built here).
        //
        //  if you're not containerizing, just skip this AND the Container Image scan step. 
        // --------------------------------------------------------------------------------
        //
        stage('Build') {
            steps {
                // Clean before build (if we're doing any debug in the AppSec stage we should comment this out)
                cleanWs()
                // We need to explicitly checkout from SCM here
                checkout scm
                // get the docker-hub credential (or whatever username/password credential for whatever registry)
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
                    // log in to registry, // set up buildx, // Build and push the image
                    sh '''
                        echo "${REGISTRY_PASSWORD}" | docker login ${REGISTRY} -u "${REGISTRY_USER}" --password-stdin
                        docker buildx inspect --bootstrap
                        docker buildx build --push --tag ${IMAGE} .
                    '''
                } // end withCredentials
            } //end steps
        } // end stage
        //
        //
        // NOTE: skip this stage if you aren't containerizing your project.
        //
        // in this section , you need a PROJECT_KEY (a label Orca uses to organize findings) which
        // is defined globally since it's going to also be used in the above pre-build test stages.
        //
        // NOTE: --exit-code 0 prevents scan failures from breaking the build.
        // In production, remove this flag from each stage so critical findings block the pipeline.
        //
        // orca-cli lets you pass the api token on the command line with --api-token but it also will
        // simply read it from the env ORCA_SECURITY_API_TOKEN, which is what we're using here.
        //
        stage('Orca Container Image Security Scan') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'ORCA_SECURITY_API_TOKEN', variable: 'ORCA_SECURITY_API_TOKEN')]) {
                        sh '${LOCAL_BIN}/orca-cli --no-color --exit-code=0 --project-key="${PROJECT_KEY}" image scan ${IMAGE} --dependency-tree'
                    } //end withCredentials
                } // end script
            } // end steps
        } // end stage
        //
    } // end stages
 
    post {
        always {
            // Clean up Docker login credentials and the image from the agent
            sh '''
                docker image rm ${IMAGE} || true
                docker logout ${REGISTRY} || true
            '''            //
            // thought about doing a cleanWs() here but I like leaving the workspace as-is so I can investigate if needed
            //
        } // end always
    } //end post
} //end pipeline
