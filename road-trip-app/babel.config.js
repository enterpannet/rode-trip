module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./app'],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          alias: {
            '@': './app',
            '@/components': './app/components',
            '@/screens': './app/screens',
            '@/services': './app/services',
            '@/store': './app/store',
            '@/types': './app/types',
            '@/utils': './app/utils',
          },
        },
      ],
    ],
  };
};
