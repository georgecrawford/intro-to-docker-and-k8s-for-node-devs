autoscale: true



---

### a little bit of
# [fit] ops 
### in your
# [fit] dev

---

# About me

- George Crawford
- Engineer at OVO Energy in Bristol
- Senior Developer at the Financial Times
- Developer at Assanka, later FT Labs
- Freelance classical musician and Wordpress wrangler

[.footer: [OVO Energy jobs](https://www.ovoenergy.com/careers/vacancies)  •  [FT.com](https://www.ft.com/)  •  [FT web app](https://app.ft.com/)  •  [FT Labs](https://labs.ft.com/)]

---

# Before we start

^
- hands up if you write JavaScript for your job
- keep them up if you write server-side applications in Node.js
- keep them up if you've ever done any 'ops' or dev-ops': CI or server configuration, etc.
- keep them up if you have been known to FTP files onto a server
- keep them up if you have ever live-edited a file on a server in production
- Who's ever used Docker?
- Who's ever used Heroku?
- who's ever used kubernetes?

---

# Before we start

^ 
- talk is: "An introduction to Docker and Kubernetes for Node.js developers"
- but I'm a developer
- not a deep dive where you'll learn everything
- a more personal story of how my relationship with servers has changed over the years

---

# Servers and me

---

# Servers and me
### A story in five parts:

- **Part 1**: FTP & mounted drives
- **Part 2**: Sandboxes, Puppet, Jenkins, scary 'prod'
- **Part 3**: Virtual Machines & Vagrant
- **Part 4**: Containerisation
- **Part 5**: Orchestration


---

# Part 1: FTP & mounted drives

^ 
- FTP code onto a server. Wordpress, etc.
- I discovered rsync and mounted SFTP drives, so could work 'on the server'

---

# Part 2: Sandboxes, Puppet, Jenkins, scary 'prod'

^ 
- First real job
- Suite of servers
- herbs and spices: Tarragon, Ginger
- fond memory: Turmeric was upgraded to Saffron
- in a datacentre which we sometimes needed to drive to to install a new rack box

---

# Part 2: Sandboxes, Puppet, Jenkins, scary 'prod'

^ 
- Server configuration was managed by Puppet
- code was deployed via rsync by Jenkins CI jobs
- production was terrifying
- had to keep it up at all costs
- although Puppet helps keep servers up-to-date, it doesn't give a verifiable environment
- occasionally live-edited code on prod, which 'sometimes' made it back into our version control

---

# Part 2: Sandboxes, Puppet, Jenkins, scary 'prod'

^ 
- for local dev: a 'sandbox' server
- hosted in a server room a few meters from our desks to be fast
- everyone on the team had a different way of getting code onto the server: 
	- some SSH'd in and used Vim
	- some mounted the drive and worked locally, with hiccoughs
	- some developed complicated 2-way rsync solutions (mention Kornel?)

---

# Part 3: Virtual Machines & Vagrant

^ 
- We then migrated to a Vagrant setup
- a full virtual machine on our laptops with the services we needed
- mounting folders into it from the host
- running same servers on Mac, Windows and Linux

---

# Part 3: Virtual Machines & Vagrant

^ 
- not a bad workflow
- still loads of compromises: 
1. simplified versions of things for local dev
2. everything in the same VM rather than isolated as it would be in prod
3. all localhost networking
4. no load balancing

---

# Part 3: Virtual Machines & Vagrant

^ 
- Most worryingly:
- dev, ci and prod could easily get out of sync
- we had no easy way to verify new versions of software
- Even with Puppet, how can you be sure that everything on the server has been documented?

---

# Cattle, not pets

^ who's heard of this term?

---

# Part 4: Containerisation



---

# Part 5: Orchestration


---

## Docker 

---

### Docker: introduction

```docker
FROM [IMAGE]
```

^ Most docker commands relate to an image. An image is built from a manifest file, called a 'Dockerfile'. You're building up a bundle of resources which can run a single process

[.footer: /Dockerfile]

---

### Docker: introduction

```docker
FROM node:8
```

^ each line in the file is an instruction (inherit from another image, add files, run commands, set permissions, etc.)

[.footer: /Dockerfile]

---

### Docker: the Dockerfile

| | |
--- | --- 
**FROM** | define the base image used to start the build process
**WORKDIR** | set the path where commands are executed, and files are copied to
**ENV** | set environment variables
**ADD** | add files from a source on the host to the container’s own filesystem
**CMD** | set the default command to run when the container starts
**ENTRYPOINT** | set the default application to be used when the container starts
**EXPOSE** | expose a port to the outside world
**RUN** | execute a script or command (e.g. bash)
**USER** | set the UID (username) that will run the container
**VOLUME** | enable access from the container to a directory on the host machine

---

### Docker: commands

```bash, [.highlight: 1-4]
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

### Docker: commands

```bash, [.highlight: 6-7]
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

### Docker: image registry

![right fit](images/dockerhub.png)

[.footer: [https://hub.docker.com/_/node/](https://hub.docker.com/_/node/) ]

^ Docker images inherit from other images - eventually down to a base image. For node, there are many varieties of tag on the 'Docker Hub' registry:

---

### Docker: Image variants
| | | 
| :--- | :--- | 
| **node:8** | de facto, based on common `buildpack-deps` image (Debian 'jessie') | 
| **node:8-alpine** | lightweight, much smaller images, great for CI and deployment | 

---

### Docker: Tags and updates
|  |  |
| :--- | :--- |
| :**8.7.0** | fixed at 8.7.0 |
| :**8.7** | < 8.8.0 |
| :**8** | < 9.0.0 |
| :**latest** | ∞ |

---

### Docker: image layers

```docker
FROM node:8

RUN echo 'hello world!'
```

[.footer: `/Dockerfile`]

^ each instruction in the Dockerfile creates a new layer, with a checksum to verify its integrity
**demo: build, new layer**

^ first layer is cached

---

### Docker: layer caching

Use `ENV` variables to bust the cache:

```docker, [.highlight: 10-12]
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
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

###Docker: Simple example

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

###Docker: Simple example


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

###Docker: Simple example

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

### Docker: Mounting volumes
```bash
# Mount the current working directory into the container at /app
$ docker run -p 1234:8080 -v $(pwd):/app 943cc8886f5f
```

---

### Docker: Mounting volumes

- use Nodemon or PM2 to watch for filesystem changes
- **Warning**: `inotify` often not supported, so use polling (`nodemon --legacy-watch`)
- Lots of files can eat CPU, so consider watching _from the host_


^ Then you can use `nodemon` or similar to restart the Node process when files change
Caveat: Linux containers don't generally have native `inotify`, so tools like 

[.footer: [https://github.com/remy/nodemon](https://github.com/remy/nodemon), [https://github.com/foreverjs/forever](https://github.com/foreverjs/forever), [http://pm2.keymetrics.io/](http://pm2.keymetrics.io/)]
[.build-lists: true]

---

### Docker: Single process model

- Nodemon, PM2, forever, etc.
- or, use `dumb-init` to provide a well-behaved primary process to correctly respond to signals:

[.footer: [https://github.com/Yelp/dumb-init](https://github.com/Yelp/dumb-init)]
[.build-lists: true]

---

### Docker: Single process model

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

## Kubernetes 

---

### What is Kubernetes?

- an open-source platform designed to automate deploying, scaling, and operating application containers
- deploy your applications quickly and predictably
- scale your applications on the fly
- roll out new features seamlessly
- limit hardware usage to required resources only
- portable: public, private, hybrid, multi-cloud
- extensible: modular, pluggable, hookable, composable
- self-healing: auto-placement, auto-restart, auto-replication, auto-scaling

[.footer: [https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)]
[.build-lists: true]

---

### What is Kubernetes?

- Google's Borg, 10+ year old resource orchestration software
- Kubernetes founded by Google as an open source project in 2014
- Several of Borg's top contributors also work on Kubernetes
- Donated to the Cloud Native Computing Foundation, hosted at the Linux Foundation, supported by Google, Cisco, Docker, IBM, and Intel
- A reference architecture for cloud technologies that anyone can use

[.build-lists: true]

---

> "Everything at Google runs in a container. We start over two billion containers per week."


[.footer: Joe Beda: [https://speakerdeck.com/jbeda/containers-at-scale](https://speakerdeck.com/jbeda/containers-at-scale)]

---

### Kubernetes components: the good stuff
| | |
| --- | --- |
| **Pod ** | A set of containers that need to run together |
| **Service ** | Describes a set of pods that provide a useful service |
| **Ingress rule**  | Specify how incoming network traffic should be routed to services and pods |
| **Controller ** | Automatic pod management. <br>**Deployment**: maintains a set of running pods of the same type <br>**DaemonSet **: runs a specific type of pod on each node <br>**StatefulSet **: like a deployment, but pods are in a guaranteed order  |

---

### Kubernetes components: the other stuff
| | |
| --- | --- |
| **Node** | A worker machine - physical or virtual - running `docker`, `kubelet` and `kube-proxy` |
| **Cluster** | The entire Kubernetes ecosystem; one or more nodes |
| **Namespace ** | Used to group, separate, and isolate objects, for access control, network access control, resource management, etc. |
| **Persistent Volume**  | Abstraction for persistent storage; many volume types are supported |
| **Network policy ** | Network access rules between pods inside the cluster |
| **ConfigMap & Secret ** | Separates configuration information from application definition |
| **Job** | A pod which runs to completion and can be scheduled, like cron |

---

### Kubernetes architecture

![inline](images/k8s-arch-1.png)

[.footer: [https://thenewstack.io/kubernetes-an-overview/](https://thenewstack.io/kubernetes-an-overview/)]

---

### Kubernetes architecture: master

![inline](images/k8s-arch-2.png)

[.footer: [https://thenewstack.io/kubernetes-an-overview/](https://thenewstack.io/kubernetes-an-overview/)]

---

### Kubernetes architecture: nodes

![inline](images/k8s-arch-3.png)

[.footer: [https://thenewstack.io/kubernetes-an-overview/](https://thenewstack.io/kubernetes-an-overview/)]

---

![40%](images/ui-dashboard.png)

[.footer: [https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)]

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

