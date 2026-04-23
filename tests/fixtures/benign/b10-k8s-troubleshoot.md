# Kubernetes Troubleshooting

Quick diagnostic steps for failing pods.

## Check pod status

```bash
kubectl get pods -n my-namespace
kubectl describe pod my-pod
```

## Logs

```bash
kubectl logs my-pod --previous
kubectl logs my-pod -c my-container -f
```

## Events

```bash
kubectl get events --sort-by=.lastTimestamp
```

## Common issues

### CrashLoopBackOff

Check the container's exit code and stderr. If migrating from a previous version of the app, check for startup misconfiguration.

### ImagePullBackOff

- Registry credentials missing
- Image tag typo
- Private registry unreachable from the cluster

### Pending

- Insufficient node resources
- Unschedulable due to affinity rules
- Missing PersistentVolumeClaim

## Resource limits

Set requests and limits on every container. Containers without limits can starve neighbors during load.

## Debugging networking

`kubectl exec` into a sidecar and run `wget` or `nslookup` against the target service.
