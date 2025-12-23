#!/bin/bash
# Script para crear iconos PNG usando ImageMagick (si está disponible)
# o recordatorio para crearlos manualmente

echo "Creando iconos PNG para PWA..."

# Verificar si ImageMagick está instalado
if command -v convert &> /dev/null; then
    echo "ImageMagick encontrado, creando iconos..."
    # Crear ícono 192x192
    convert -size 192x192 xc:'#2e7d32' \
            -fill white -draw 'circle 96,96 96,20' \
            -gravity center -pointsize 120 -fill '#2e7d32' -annotate +0+0 'P' \
            icon-192.png
    
    # Crear ícono 512x512
    convert -size 512x512 xc:'#2e7d32' \
            -fill white -draw 'circle 256,256 256,56' \
            -gravity center -pointsize 320 -fill '#2e7d32' -annotate +0+0 'P' \
            icon-512.png
    
    echo "✅ Iconos PNG creados"
else
    echo "⚠️  ImageMagick no está disponible"
    echo "Los iconos PNG deben crearse manualmente"
fi
