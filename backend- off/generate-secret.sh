#!/bin/bash

# Gera uma chave segura para JWT_SECRET
echo "Gerando chave segura para JWT_SECRET..."
openssl rand -hex 32
