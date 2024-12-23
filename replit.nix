{ pkgs }: {
    deps = [
      pkgs.mongosh
        pkgs.openssh
        pkgs.cowsay
        pkgs.docker-compose
        pkgs.docker
        pkgs.redis
        pkgs.mongodb
        pkgs.certbot
    ];
}