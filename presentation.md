autoscale: true

---

Before we start:
- hands up if you write JavaScript for your job
- keep them up if you write server-side applications in Node.js
- (another step?)
- keep them up if you have been known to FTP files onto a server
- keep them up if you have ever live-edited a file on a server in production
- Who's ever used Docker?
- who's ever used kubernetes?

---


- 12-factor app
- history of Docker
- pitfalls of traditional approach
- cattle not pets
- Puppet: how can you be sure that everything on the server has been documented? Scared to apply a patch because a server has been 'up' for so long?
- Docker is not enough
	- the application in a container is only a small part of the picture
	- run a container in production, but with firewalls, networking all manually provisioned - confusing AWS console
	- how can you be sure that the right number of containers are always running?
	- how can you make the best use of resources (CPU, memory)?

---

# me using containers

- first, FTP. All our servers were named after spices: I remember when Turmeric was replaced by Saffron
- Jenkins deployment to server via rsync; common to ssh in; Puppet to manage server config
- played with Vagrant for local development. Docker relies on containerization, while Vagrant utilizes virtualization. Vagrant is a "Virtual Machine manager" . Single tool for provisioning Virtual Machines/Containers from any of the providers. For its virtualisation it can use different providers. Originally the default provider was virtualbox, but it now supports many more, including vmware fusion, Amazon EC2, Google Compute Engine, Rackspace cloud.
	- **Virtualization**: With virtualization, each virtual machine runs its own entire operating system inside a simulated hardware environment provided by a program called hypervisor running on the physical hardware.
	- ![Virtualisation](./images/virtualisation.png) https://www.quora.com/What-is-the-difference-between-Docker-and-Vagrant-When-should-you-use-each-one
	- +++ the near-complete separation between the virtual machine(s) and the host enables you to have Linux virtual machines on a Windows host or vice versa.
	- - - - you have to dedicate a static amount of resources (CPU, RAM, storage) to the virtual machines, and the hypervisor will eat up a lot of resources (this is usually referred to as overhead)
	- **Containerisation**
	- Containerization allows multiple applications to run in isolated partitions of a single Linux kernel running directly on the physical hardware. Linux cgroups and namespaces are the underlying Linux kernel technologies used to isolate, secure and manage the containers.
	- ![Containerisation](./images/containerisation.png)
	- +++ Performance is higher than virtualisation since there is no hypervisor overhead, and you are closer to the bare metal. Also the container simply uses whatever resources it needs, period.
	- - - - Containers use the host machine’s kernel. No funny Windows stuff on a Linux host.
- Cattle, not Pets (coined in 2012)

> In the old way of doing things, we treat our servers like pets, for example Bob the mail server. If Bob goes down, it’s all hands on deck. The CEO can’t get his email and it’s the end of the world. In the new way, servers are numbered, like cattle in a herd. For example, www001 to www100. When one server goes down, it’s taken out back, shot, and replaced on the line.

### Pets
Servers or server pairs that are treated as indispensable or unique systems that can never be down. Typically they are manually built, managed, and “hand fed”. Examples include mainframes, solitary servers, HA loadbalancers/firewalls (active/active or active/passive), database systems designed as master/slave (active/passive), and so on.

> First you give them a name. Then you installed services on that server, and if the server got corrupted or hardware failed you had to repair the computer, possibly rebuild the hard drive, fix corrupted filesystems, I could go on essentially you nursed it back to health. This is referred to as “taking care of a pet”, you take care of it, you update, upgrade, and patch it. Some applications still need this attitude, but many in this decade do not! Now we’ve changed, and we with RESTful APIs can quickly spin up infrastructure, and build from scratch to a working machine in minutes.

### Cattle
Arrays of more than two servers, that are built using automated tools, and are designed for failure, where no one, two, or even three servers are irreplaceable. Typically, during failure events no human intervention is required as the array exhibits attributes of “routing around failures” by restarting failed servers or replicating data through strategies like triple replication or erasure coding. Examples include web server arrays, multi-master datastores such as Cassandra clusters, multiple racks of gear put together in clusters, and just about anything that is load-balanced and multi-master.

> Now with cloud computing we are able to do amazing things. I can easily build a “golden image” from a running application, even build that image from scratch and use it in an autoscaled environment (something Netflix has done for years!). Using tools like Ansible, Puppet, Salt, and Chef, you can quickly build new infrastructure that is known to work. You can even use those tools to build a brand new image which can then be used to create 100 servers just with one command line entry. Instead of names these guys get numbers. All servers are essentially identical to each other. If a server dies, you issue a couple API calls (or not if you are using AWS Autoscaling or similar, as it does it for you if you want it to), and now you have replaced that server in your environment. If a cow is ill/dying you kill it, and get another. That’s where this analogy originates. 

http://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/

In the context of comparing it to Puppet and Chef, it is better to think of Docker as a way to package code into consistent units of work. These units of work can then be deployed to testing, QA and production environments with far greater ease. Puppet, Ansible, Chef, etc. all share a complexity that reflects the difficulty of configuring bare metal and virtual machines.  This means not only launching them, but also modifying the state of their configuration -- often with the release of new software. Because Docker needs to only to express the configuration for a single process, the problem becomes far easier.  The Dockerfile is, thus, not much more than a simple bash script for configuring a process with its dependencies.

---
Joe Beda (one of the founders of Kubernetes):

> The way I think about it: every difference between dev/staging/prod will eventually result in an outage.

https://twitter.com/jbeda/status/921185541487341568

---

[http://localhost:5000/1](http://localhost:5000/1)

^ [http://localhost:5000/1](http://localhost:5000/1)


---

Talk is called "An introduction to Docker and Kubernetes for Node.js developers", but I'm a developer. Rather than a deep dive where you'll learn everything, this is a more personal story of how my relationship with servers has changed over the years.

---

1. FTP code onto a server. Wordpress, etc.
2. I discovered rsync and mounted SFTP drives, so could work 'on the server'
3. First real job: a suite of servers (affectionately named after herbs and spices - Tarragon, Turmeric, Saffron), in a datacentre which we sometimes needed to drive to to install a new rack box
4. Server configuration was managed by Puppet, code was deployed via rsync by Jenkins CI jobs
	- a number of drawbacks (TODO), but the thing which bit us most often, and seemed so hard to solve, was how different dev, ci and production environments were.
	- we ended up with a 'sandbox' environment, hosted in a server room a few meters from our desks, and everyone on the team had a different way of getting code onto the server: 
		- some SSH'd in and used Vim
		- some mounted the drive and worked locally, with hiccoughs
		- some developed complicated 2-way rsync solutions
	- We then migrated to a Vagrant setup, running a full virtual machine with the services we needed, and mounting folders into it from the hosts. Not a bad workflow, but there were loads of compromises: simplified installations of software, everything in the same VM rather than isolated as it would be in prod, all localhost networking, no load balancing. Most worryingly, we could get out of sync between dev, ci and prod extremely easily, and we had no easy way to verify new versions of software.
	- mention live-editing server files in production, and how different that process is with Docker
	- running code on Mac, Windows and Linux

---

So how to improve confidence that the process you run locally in development behaves the same as in production? The first challenge we need to solve is similar to good code practice: isolation, encapsulation, versioning, declarative, standardised, repeatable, verifiable, simplicity for developers, portability

---

quick intro to Docker

---

So what does Docker look like for us JavaScript developers?


---

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

kubernetes

- how does Docker solve the problems I had in my last job?
	- more confidence in exactly what is running on each server
	- confidences that processes are secure and isolated
	- much easier for devs to spin up a production-like server environment for each app
- although our main application processes are now well described, we still have huge differences between dev, ci, staging and production
	- each individual application component (front-end server, API server, database server, etc.) are now well-described with Docker images, but not how they communicate together
	- production has multiple redundant replicas of each server process, and a loadbalancer running across them. Perhaps also autoscaling
	- production environment will vary depending on the cloud provider: AWS, Google Cloud, etc.
	- local dev setup uses localhost, incorrect ports, different filesystems, etc.
- history of k8s
- concepts (https://www.sitepoint.com/kubernetes-deploy-node-js-docker-app/)
- very complex tool, but quite easy to get started
- create pod from image (explain pod can have multiple containers sharing localhost and filesystem, but with different images!), demo pod running (kubectl describe)
- create service to expose pod on a port (show curl hostname working internally)
- create replicaset (keeps required number of pods alive)
- create deployment (wraps a replicaset, adds scaling, rollout and roll-back) (spin up one pod, scale to two, kill both, watch them recreate)
- create ingress
- All these demos have been on my local machine with Minikube
- IDENTICAL IN PROD
- supported in loads of cloud providers
- for a loadbalancer, we use Nginx Ingress Controller, which means we don't use a provider-specific loadbalancer
- we have autoscaling built in
- lots more to learn:
	- clusters, nodes and nodepools
	- prometheus
	- helm
	- stern
	- GitLab CI

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

---

Local development will, I hope, be getting much nicer, as Docker have just announced future support for Kubernetes in their free Community Edition, meaning you can run complete k8s setups locally, for free, using your native hypervisor rather than a virtual machine.  

Docker support for Kubernetes

[.footer: [https://www.docker.com/kubernetes](https://www.docker.com/kubernetes)]

---

https://www.sitepoint.com/kubernetes-deploy-node-js-docker-app/local
