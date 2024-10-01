FROM --platform=linux/amd64 ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/conda/bin:/usr/local/bin:${PATH}" \
    PYTHONPATH="/app:/app/stable_retro_scripts:${PYTHONPATH:-}" \
    DISPLAY=:99 

# Install system dependencies and additional FFmpeg dependencies
RUN apt-get update && apt-get install -y \
    git python3-pip python3-dev zlib1g-dev libopenmpi-dev cmake wget unzip nano \
    libqt5opengl5-dev qtbase5-dev libopencv-dev libhdf5-dev libhdf5-serial-dev hdf5-tools \
    nginx build-essential nodejs npm netcat bzip2 ca-certificates libx11-dev libxcb1-dev \
    libx11-xcb-dev libxcb-keysyms1-dev libxcb-image0-dev libxcb-shm0-dev libxcb-icccm4-dev \
    libxcb-sync0-dev libxcb-xfixes0-dev libxcb-shape0-dev libxcb-randr0-dev \
    libxcb-render-util0-dev libxcb-xinerama0-dev libx264-dev libmp3lame-dev libgl1-mesa-glx \
    libglib2.0-0 strace net-tools curl nasm yasm xvfb x11vnc supervisor \
    htop iotop lsof tcpdump vim less procps \
    libass-dev libfreetype6-dev libsdl2-dev libtool libva-dev libvdpau-dev \
    libvorbis-dev libxcb1-dev libxcb-shm0-dev libxcb-xfixes0-dev pkg-config \
    texinfo zlib1g-dev libavdevice-dev libavfilter-dev libopus-dev \
    libvpx-dev libwebp-dev libx265-dev libnuma-dev libfdk-aac-dev \
    libxcomposite-dev \
    libxinerama-dev \
    libv4l-dev \
    libxrandr-dev \
    libxext-dev \
    libxrender-dev \
    libxau-dev \
    libxfixes-dev \
    libpulse-dev \
    libasound2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install FFmpeg with extended support
WORKDIR /tmp
RUN git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg && \
    cd ffmpeg && \
    ./configure \
    --prefix=/usr/local \
    --enable-gpl \
    --enable-libass \
    --enable-libfdk-aac \
    --enable-libfreetype \
    --enable-libmp3lame \
    --enable-libopus \
    --enable-libvorbis \
    --enable-libvpx \
    --enable-libx264 \
    --enable-libx265 \
    --enable-nonfree \
    --enable-shared \
    --enable-libxcb \
    --enable-libxcb-shm \
    --enable-libxcb-xfixes \
    --enable-libxcb-shape \
    --enable-libwebp \
    --enable-postproc \
    --enable-small \
    --enable-version3 \
    --enable-indev=xcb \
    --enable-indev=alsa \
    --enable-indev=pulse \
    --enable-outdev=alsa \
    --enable-outdev=pulse \
    --extra-cflags="-I/usr/local/include" \
    --extra-ldflags="-L/usr/local/lib" \
    --extra-libs="-lpthread -lm" && \
    make -j$(nproc) && \
    make install && \
    ldconfig && \
    cd .. && \
    rm -rf ffmpeg

# Now install Miniconda and set up environment
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \
    /bin/bash ~/miniconda.sh -b -p /opt/conda && \
    rm ~/miniconda.sh && \
    conda create -n retro_env python=3.9 -y

SHELL ["conda", "run", "-n", "retro_env", "/bin/bash", "-c"]

# Copy and install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN conda install -y -c pytorch pytorch torchvision torchaudio cpuonly && \
    pip install -r /app/requirements.txt

# Install and build stable-retro
RUN git clone https://github.com/Farama-Foundation/stable-retro.git /app/stable-retro && \
    cd /app/stable-retro && \
    pip install -e . && \
    python3 -m retro.import /app/stable-retro/retro/data/stable

# Install and build stable-retro-scripts
RUN git clone https://github.com/MatPoliquin/stable-retro-scripts.git /app/stable-retro-scripts && \
    cd /app/stable-retro-scripts/ef_lib && \
    wget https://download.pytorch.org/libtorch/cpu/libtorch-cxx11-abi-shared-with-deps-1.13.1%2Bcpu.zip && \
    unzip libtorch-cxx11-abi-shared-with-deps-1.13.1+cpu.zip && \
    rm libtorch-cxx11-abi-shared-with-deps-1.13.1+cpu.zip && \
    cmake . -DCMAKE_PREFIX_PATH=$(pwd)/libtorch && \
    make

# Set up directories and copy files
RUN mkdir -p /app/logs /app/save_states /app/hls && \
    chmod 777 /app/logs /app/save_states /app/hls
COPY nginx.conf /etc/nginx/nginx.conf
COPY custom_scripts/ /app/custom_scripts/
COPY gun_game_saves/ /app/gun_game_saves/
COPY start_streaming.sh /app/
COPY logs/ /app/logs/
COPY roms/ /app/roms/
COPY models/ /app/models/
COPY package.json gunServer.js fightProcess.js fightManager.js /app/
RUN chmod +x /app/custom_scripts/*.sh /app/start_streaming.sh

WORKDIR /app

# Install Gun
RUN npm install && npm install gun express

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 80 8765 

# Set the entrypoint to run supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]