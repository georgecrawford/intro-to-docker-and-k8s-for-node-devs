autoscale: true




### Docker introduction

```docker
FROM [IMAGE]
```

^ Most docker commands relate to an image. An image is built from a manifest file, called a 'Dockerfile'. You're building up a bundle of resources which can run a single process

[.footer: /Dockerfile]

---

### Docker introduction

```docker
FROM node:8
```

^ each line in the file is an instruction (inherit from another image, add files, run commands, set permissions, etc.)

[.footer: /Dockerfile]

---

### Docker introduction

| | |
--- | --- 
**FROM** | define the base image used to start the build process
**ENV** | set environment variables
**ADD** | copy files from a source on the host to the container’s own filesystem at the set destination.
**CMD** | execute a specific command within the container
**ENTRYPOINT** | set a default application to be used every time a container is created with the image
**EXPOSE** | expose a specific port to enable networking between the container and the outside world
**RUN** | central executing directive for Dockerfiles
**USER** | set the UID (the username) that will run the container
**VOLUME** | enable access from the container to a directory on the host machine
**WORKDIR** | set the path where the command, defined with CMD, is to be executed

---

### Docker introduction

```bash, [.highlight: 2]
# Build an image from the Dockerfile
docker build .
... 
Successfully built badd967af535

# Run the image as a container, in an interactive terminal
$ docker run --rm -it badd967af535
```

^ First we'll build an image from our manifest
**demo: build**

---

### Docker introduction

```bash, [.highlight: 7]
# Build an image from the Dockerfile
docker build .
... 
Successfully built badd967af535

# Run the image as a container, in an interactive terminal
$ docker run --rm -it badd967af535
```

^ Building an image gives us a checksum. We can make a container out of an image using `docker run`, and we have a Node 8 container.
**demo: run**


---

# Docker image registry

![right fit](images/dockerhub.png)

[.footer: [https://hub.docker.com/_/node/](https://hub.docker.com/_/node/) ]

^ Docker images inherit from other images - eventually down to a base image. For node, there are many varieties of tag on the 'Docker Hub' registry:

---

## Image variants
| | | 
| :--- | :--- | 
| **node:8** | de facto, based on common `buildpack-deps` image (Debian 'jessie') | 
| **node:8-alpine** | lightweight, much smaller images, great for CI and deployment | 

---

##Tags and updates
|  |  |
| :--- | :--- |
| :**8.7.0** | fixed at 8.7.0 |
| :**8.7** | < 8.8.0 |
| :**8** | < 9.0.0 |
| :**latest** | ∞ |

---

```docker
FROM node:8

RUN echo 'hello world!'
```

[.footer: `/Dockerfile`]

^ each instruction in the Dockerfile creates a new layer, with a checksum to verify its integrity
**demo: build, new layer**

^ first layer is cached

---

Use `ENV` variables to bust the cache:

```docker, [.highlight: 18-19]
# gpg keys listed at https://github.com/nodejs/node#release-team
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    56730D5401028683275BD23C23EFEFE93C4CFFFE \
  ; do \
    gpg --keyserver pgp.mit.edu --recv-keys "$key" || \
    gpg --keyserver keyserver.pgp.com --recv-keys "$key" || \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" ; \
  done

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 8.7.0

RUN ARCH= && dpkgArch="$(dpkg --print-architecture)" \
  && case "${dpkgArch##*-}" in \
    amd64) ARCH='x64';; \
    ppc64el) ARCH='ppc64le';; \
    s390x) ARCH='s390x';; 
```

[.footer: [https://github.com/nodejs/docker-node/blob/master/8.7/Dockerfile](https://github.com/nodejs/docker-node/blob/master/8.7/Dockerfile)] 

^ 
- So how can you even upgrade Node when it's always cached? 
- Bust the cache in an earlier layer with environment variables
- you can also see multiple commands chained together: ensures dependencies are all cached in a single layer

---

###Simple example

```js
const express = require('express');

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.get('*', (req, res) => {
	console.log(`Handling request to ${req.path}`);
	res.send('Hello world\n');
});

app.listen(PORT, HOST, () => {
	console.log(`Running on http://${HOST}:${PORT}`);
});
```
[.footer: `/index.js`]

---

###Simple example


```docker
FROM node:8-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
```

[.footer: `/Dockerfile`]

---

###Simple example

```bash
# Build
$ docker build .

# Edit a file, and build again - most layers are cached
$ docker build .

# Run the image as a container, mapping host port to container port
$ docker run --rm -p 1234:8080 -t 943cc8886f5f

# See it working
$ curl localhost:1234
```

^ **demo: Node.js image**


---

### Mounting volumes
```bash
# Mount the current working directory into the container at /app
$ docker run -p 1234:8080 -v $(pwd):/app 943cc8886f5f
```

---

### Mounting volumes

- use Nodemon or PM2 to watch for filesystem changes
- **Warning**: `inotify` often not supported, so use polling (`nodemon --legacy-watch`)
- Lots of files can eat CPU, so consider watching _from the host_


^ Then you can use `nodemon` or similar to restart the Node process when files change
Caveat: Linux containers don't generally have native `inotify`, so tools like 

[.footer: [https://github.com/remy/nodemon](https://github.com/remy/nodemon), [https://github.com/foreverjs/forever](https://github.com/foreverjs/forever), [http://pm2.keymetrics.io/](http://pm2.keymetrics.io/)]
[.build-lists: true]

---

### Single process model

- Nodemon, PM2, forever, etc.
- or, use `dumb-init` to provide a well-behaved primary process to correctly respond to signals:

[.footer: [https://github.com/Yelp/dumb-init](https://github.com/Yelp/dumb-init)]
[.build-lists: true]

---

### Single process model

```docker
# Download and install dumb-init
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64
RUN chmod +x /usr/local/bin/dumb-init

# Define dumb-init as the entrypoint for the container
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Starting this container will actually run `/usr/bin/dumb-init -- node index.js`
CMD ["node", "index.js"]
```


[.footer: /Dockerfile]

---

### Docker: advantages
- **encapsulation**: A Docker container includes everything your app needs to run
- **portability**: Docker runs cross-platform, and Docker images can be very easily shared
- **trust**: A Docker image produces an _identical_ container in local dev, CI and production
- **isolation**: Networking, file systems, processes, permissions are all tightly controller and isolated
- **declarative**: The `Dockerfile` can be checked-in to version control, and new image manifests easily tested in CI
- **speed**: Since a Docker container doesn't boot an OS, they can be extremely fast to start up

---

### Docker: lots more to learn

- entrypoints, commands and arguments
- tagging and pushing an image to a registry
- advanced networking & permissions
- `docker-compose`
- plenty of Docker/Node.js tutorials available on the web

[.build-lists: true]



---

# development
![right](images/local.jpeg)

[.footer: [https://goo.gl/6QbNrn](https://goo.gl/6QbNrn)]

---

# staging
![right](images/staging.jpeg)

[.footer: [https://goo.gl/QZEtpJ](https://goo.gl/QZEtpJ)]

---

# production
![right](images/production.jpeg)

[.footer: [https://goo.gl/TYU8fv](https://goo.gl/TYU8fv)]

---

### Kubernetes demo

---

### Kubernetes demo: pods

```bash
docker build -t georgecrawford/node-docker-k8s-demo:v1 .
docker push georgecrawford/node-docker-k8s-demo:v1
```

<sub>See: [https://hub.docker.com/r/georgecrawford/node-docker-k8s-demo/](https://hub.docker.com/r/georgecrawford/node-docker-k8s-demo/)</sub>

^ 
- For this demo, we need our Docker image to be in an accessible location. 
- Possible to use a private location
- for easy demo, using main Docker Hub


---

### Kubernetes demo: pods

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nodejs
  labels:
    app: nodejs
spec:
  containers:
  - name: nodejs
    image: georgecrawford/node-docker-k8s-demo:v1
```

[.footer: /pod.yaml ]
^ 
- The basic unit in k8s is the pod
- This is the simplest of pods: it has a name, a label, and a single container
- Let's create it
**demo: pods**

---

### Kubernetes demo: pods

```bash
$ curl 172.17.0.18:8080
Hello world
```

^ 
- If we were to SSH onto the virtual machine running kubernetes, we could cURL the pod using its IP address

---

### Kubernetes demo: services

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nodejs
spec:
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: nodejs
```

^ 
- Services take care of routing local network traffic to pods 
- The pod selector identifies the set of pods to load-balance traffic to
- The ports section is the same as the `docker run` command from earlier: map host port to container port
- **demo: services**

[.footer: /service.yaml ]

---

### Kubernetes demo: services

```bash
curl nodejs.demo:8080
Hello world
```

^ 
- Then, from another pod somewhere in the cluster, we can cURL the pod using a hostname (service.namespace)

---

### Kubernetes demo: replica sets

```yaml
apiVersion: extensions/v1beta1
kind: ReplicaSet
metadata:
 name: nodejs
spec:
 replicas: 1
 selector:
   matchLabels:
     app: nodejs
 template:
   metadata:
     labels:
       app: nodejs
   spec:
     containers:
      - name: nodejs
        image: georgecrawford/node-docker-k8s-demo:v1
```

^ 
- This is where the benefit of a 'container orchestrator' really becomes obvious
- A replica set declares a desired number of replicas of a pod. 
- Kubernetes will try to achieve that, following other rules like correctly waiting for startup and shutdown
- Delete a pod, k8s detects it and will recreate
- Like the service, this rs has labels on the pods, and a selector which matches those labels
- **demo: replica sets**

[.footer: /replicaset.yaml ]

---

### Kubernetes demo: deployments

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nodejs
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: nodejs
    spec:
      containers:
      - name: nodejs
        image: georgecrawford/node-docker-k8s-demo:v1
```

^
- A deployment wraps a replicaset
- adds scaling, versioning, rollout and roll-back
- the unit of currency for CI
- **demo: deployments**

[.footer: /deployment.yaml ]

---

### Kubernetes demo: ingress

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: nodejs
spec:
  rules:
  - host: demo.local
    http:
      paths:
      - path: /
        backend:
          serviceName: nodejs
          servicePort: 8080
```

^ 
- the final piece of the puzzle
- we have a resiliant, scalable group of pods which works with CI
- we have an internal hostname, with loadbalancing across the pods
- we now need a way to route traffic into the cluster from the outside world
- this ingress will direct requests for `demo.local` which hit the cluster IP to the nodejs service, where the request will be loadbalanced across the pods
- **demo: ingresses**

[.footer: /ingress.yaml ]

