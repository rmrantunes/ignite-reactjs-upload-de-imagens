import { Box, Button, Stack, useToast } from '@chakra-ui/react';
import { RegisterOptions, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';

import { api } from '../../services/api';
import { FileInput } from '../Input/FileInput';
import { TextInput } from '../Input/TextInput';

interface FormAddImageProps {
  closeModal: () => void;
}

type FormValidations = {
  [key in 'image' | 'title' | 'description']: RegisterOptions;
};

type PostImageBody = {
  [key in 'url' | 'title' | 'description']: string;
};

type AddImageFormData = {
  title: string;
  description: string;
  image: FileList;
};

export function FormAddImage({ closeModal }: FormAddImageProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState('');
  const toast = useToast();

  const formValidations: FormValidations = {
    image: {
      required: 'Escolha uma imagem',
      validate: {
        lessThan10MB: (files: FileList) =>
          files[0]?.size < 10000000 || 'Tamanho máximo: 10MB',
        acceptedFormats: (files: FileList) =>
          ['image/jpeg', 'image/png', 'image/gif'].includes(files[0].type) ||
          'Tipos suportados: JPEG, PNG, GIF',
      },
    },
    title: {
      required: 'Título é obrigatório',
      minLength: { value: 2, message: 'Título muito curto' },
      maxLength: {
        value: 20,
        message: 'Título deve ter um tamanho máximo de 20',
      },
    },
    description: {
      required: 'Descrição é obrigatória',
      maxLength: {
        value: 65,
        message: 'Descrição deve ter um tamanho máximo de 65',
      },
    },
  };

  const queryClient = useQueryClient();
  const addImageRQMutation = useMutation(
    async (body: PostImageBody) => {
      const result = await api.post('/api/images', body);
      return result.data;
    },
    {
      onSuccess: async () => {
        await queryClient.refetchQueries('images');
      },
    }
  );

  const { register, handleSubmit, reset, formState, setError, trigger } =
    useForm<AddImageFormData>();

  const onSubmit = async (data: AddImageFormData): Promise<void> => {
    try {
      if (!imageUrl) {
        toast({ status: 'error', description: 'Url da imagem não provida' });
        return;
      }
      await addImageRQMutation.mutateAsync({
        description: data.description,
        title: data.title,
        url: imageUrl,
      });
      toast({
        status: 'success',
        title: 'Sucesso!',
        description: 'Imagem enviada sem problemas',
      });
    } catch {
      toast({ status: 'error', description: 'Erro no envio de imagem' });
    } finally {
      closeModal();
      reset();
      setImageUrl('');
      setLocalImageUrl('');
    }
  };

  return (
    <Box as="form" width="100%" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FileInput
          setImageUrl={setImageUrl}
          localImageUrl={localImageUrl}
          setLocalImageUrl={setLocalImageUrl}
          setError={setError}
          trigger={trigger}
          {...register('image', formValidations.image)}
          error={formState.errors.image}
        />

        <TextInput
          placeholder="Título da imagem..."
          {...register('title', formValidations.title)}
          error={formState.errors.title}
        />

        <TextInput
          placeholder="Descrição da imagem..."
          {...register('description', formValidations.description)}
          error={formState.errors.description}
        />
      </Stack>

      <Button
        my={6}
        isLoading={formState.isSubmitting}
        isDisabled={formState.isSubmitting}
        type="submit"
        w="100%"
        py={6}
      >
        Enviar
      </Button>
    </Box>
  );
}
